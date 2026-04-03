const { contextBridge, ipcRenderer } = require("electron");
console.log("PRELOAD RUNNING");
contextBridge.exposeInMainWorld("electronAPI", {

  selectFolder: () => ipcRenderer.invoke("select-folder"),

  cloneRepo: (data) => ipcRenderer.invoke("clone-repo", data)

});