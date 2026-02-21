const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onConfig: (cb) => {
    ipcRenderer.on('config', (_, config) => cb(config));
  },
  quitApp: () => ipcRenderer.send('quit-app'),
  shutdown: () => ipcRenderer.send('shutdown'),
  platform: process.platform,
});
