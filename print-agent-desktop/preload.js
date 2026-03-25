const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  startAgent: () => ipcRenderer.invoke('start-agent'),
  stopAgent: () => ipcRenderer.invoke('stop-agent'),
  getAgentStatus: () => ipcRenderer.invoke('get-agent-status'),
  testConnection: (apiUrl) => ipcRenderer.invoke('test-connection', apiUrl),
  registerPrinter: (apiUrl, printerData) => ipcRenderer.invoke('register-printer', apiUrl, printerData),
  
  onAgentStatus: (callback) => {
    ipcRenderer.on('agent-status', (event, data) => callback(data));
  },
  onAgentLog: (callback) => {
    ipcRenderer.on('agent-log', (event, data) => callback(data));
  },
  onAgentError: (callback) => {
    ipcRenderer.on('agent-error', (event, data) => callback(data));
  },
  onCircuitBreakerStatus: (callback) => {
    ipcRenderer.on('circuit-breaker-status', (event, data) => callback(data));
  },
});
