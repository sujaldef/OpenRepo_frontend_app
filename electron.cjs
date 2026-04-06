// main.js  (or electron.cjs if you're using CommonJS)
const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const { exec } = require('child_process');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'Open repo',

    // VERY IMPORTANT: security + IPC communication
    webPreferences: {
      preload: path.join(__dirname, './preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false, // must be false for security
      sandbox: false, // recommended in recent Electron
    },
  });
  win.webContents.openDevTools();
  // ── Custom Application Menu ───────────────────────────────────────
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Home',
          click: () => win.loadURL('http://localhost:5173'),
        },
        { type: 'separator' },
        {
          label: 'Open Folder...',
          accelerator: 'CommandOrControl+O',
          click: async () => {
            const folder = await dialog.showOpenDialog({
              properties: ['openDirectory'],
            });
            if (!folder.canceled) {
              win.webContents.send('selected-folder', folder.filePaths[0]);
            }
          },
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'resetZoom' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Load your Vite dev server (in development)
  win.loadURL('http://localhost:5173');

  // Optional: Open DevTools in dev mode
  // win.webContents.openDevTools({ mode: 'detach' });
}

// ── App lifecycle ─────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ── IPC Handlers (Renderer → Main) ────────────────────────────────────
ipcMain.handle('select-folder', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select a folder for your repository',
    });

    if (result.canceled) return null;
    return result.filePaths[0];
  } catch (err) {
    console.error('Folder selection error:', err);
    return null;
  }
});

ipcMain.handle('clone-repo', async (event, { url, folder }) => {
  return new Promise((resolve, reject) => {
    const command = `git clone "${url}" "${folder}"`;

    exec(command, { shell: true }, (error, stdout, stderr) => {
      if (error) reject(stderr || error.message);
      else resolve(stdout);
    });
  });
});

// ── Open Code Explorer in NEW Window ──────────────────────────────────
ipcMain.handle('open-code-explorer', async (event, repoId) => {
  // Create a new BrowserWindow for Code Explorer
  const codeExplorerWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1200,
    minHeight: 700,
    title: `Code Explorer - ${repoId}`,
    icon: path.join(__dirname, '../assets/icon.png'), // Change if you have an icon
    webPreferences: {
      preload: path.join(__dirname, './preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Load the Code Explorer route in the new window
  codeExplorerWindow.loadURL(`http://localhost:5173/code/${repoId}`);

  // Open DevTools if in development
  // codeExplorerWindow.webContents.openDevTools({ mode: 'detach' });

  // Return window ID so we can track it if needed
  return { success: true, windowId: codeExplorerWindow.id };
});
