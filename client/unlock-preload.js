const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('unlockAPI', {
  sendPassword: (password) => ipcRenderer.send('unlock-password', password),
  onUnlockResult: (cb) => ipcRenderer.on('unlock-result', (_, result) => cb(result)),
});
