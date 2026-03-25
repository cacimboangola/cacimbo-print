const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  startWatcher: () => ipcRenderer.invoke('start-watcher'),
  stopWatcher: () => ipcRenderer.invoke('stop-watcher'),
  getWatcherStatus: () => ipcRenderer.invoke('get-watcher-status'),
  openFolder: () => ipcRenderer.invoke('open-folder'),
  
  onWatcherStatus: (callback) => {
    ipcRenderer.on('watcher-status', (event, data) => callback(data));
  },
  onWatcherError: (callback) => {
    ipcRenderer.on('watcher-error', (event, data) => callback(data));
  }
});
