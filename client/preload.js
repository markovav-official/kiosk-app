const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onConfig: (cb) => {
    ipcRenderer.on('config', (_, config) => cb(config));
  },
  quitApp: () => ipcRenderer.send('quit-app'),
  shutdown: () => ipcRenderer.send('shutdown'),
  saveGroupId: (groupId) => ipcRenderer.send('save-group-id', groupId),
  platform: process.platform,
});
