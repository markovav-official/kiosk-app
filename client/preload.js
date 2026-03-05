const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onConfig: (cb) => {
    ipcRenderer.on('config', (_, config) => cb(config));
  },
  getConfig: () => ipcRenderer.invoke('get-config'),
  quitApp: () => ipcRenderer.send('quit-app'),
  shutdown: () => ipcRenderer.send('shutdown'),
  saveGroupId: (groupId) => ipcRenderer.send('save-group-id', groupId),
  getScreenSourceId: () => ipcRenderer.invoke('get-screen-source-id'),
  platform: process.platform,
});
