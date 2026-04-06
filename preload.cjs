const { contextBridge, ipcRenderer } = require('electron');
console.log('PRELOAD RUNNING');
contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),

  cloneRepo: (data) => ipcRenderer.invoke('clone-repo', data),

  // Open Code Explorer in a new Electron window
  openCodeExplorer: (repoId) =>
    ipcRenderer.invoke('open-code-explorer', repoId),
});
