const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

function loadConfig() {
  const configPath = path.join(app.getAppPath(), 'config.json');
  let data = {};
  try {
    if (fs.existsSync(configPath)) {
      data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (e) {
    console.error('Config load error:', e);
  }
  return {
    backendWsUrl: process.env.BACKEND_WS_URL || data.backendWsUrl || 'ws://localhost:8000/ws/client',
    authToken: process.env.AUTH_TOKEN || data.authToken || '',
    groupId: process.env.GROUP_ID || data.groupId || '',
    unlockPassword: process.env.UNLOCK_PASSWORD || data.unlockPassword || '',
    unlockShortcut: process.env.UNLOCK_SHORTCUT || data.unlockShortcut || 'CommandOrControl+Alt+L',
    deviceId: getDeviceId(),
  };
}

function getDeviceId() {
  const crypto = require('crypto');
  const storePath = path.join(app.getPath('userData'), 'device_id.json');
  try {
    if (fs.existsSync(storePath)) {
      const data = JSON.parse(fs.readFileSync(storePath, 'utf8'));
      if (data.deviceId) return data.deviceId;
    }
  } catch (e) {
    console.error('device_id read error:', e);
  }
  const deviceId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
  try {
    fs.writeFileSync(storePath, JSON.stringify({ deviceId }, null, 0));
  } catch (e) {
    console.error('device_id write error:', e);
  }
  return deviceId;
}

function saveConfigUpdate(updates) {
  const configPath = path.join(app.getAppPath(), 'config.json');
  let data = {};
  try {
    if (fs.existsSync(configPath)) {
      data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (e) {
    console.error('Config read error:', e);
  }
  Object.assign(data, updates);
  try {
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Config write error:', e);
  }
}

let mainWindow = null;
let unlockWindow = null;
let isLocked = true;
/** Only when true will app/window close (e.g. after "quit" from monitor). */
let allowClose = false;

function createWindow() {
  const config = loadConfig();

  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: true,
    kiosk: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
    },
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('config', config);
  });

  mainWindow.on('close', (e) => {
    if (!allowClose) {
      e.preventDefault();
    }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

function showUnlockWindow(config) {
  if (unlockWindow && !unlockWindow.isDestroyed()) {
    unlockWindow.focus();
    return;
  }
  unlockWindow = new BrowserWindow({
    width: 420,
    height: 320,
    modal: true,
    parent: mainWindow,
    frame: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'unlock-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  unlockWindow.setMenuBarVisibility(false);
  unlockWindow.loadFile(path.join(__dirname, 'unlock.html'));
  unlockWindow.on('closed', () => {
    unlockWindow = null;
  });
}

function lockMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  isLocked = true;
  mainWindow.setKiosk(true);
  mainWindow.setFullScreen(true);
  mainWindow.setAlwaysOnTop(true);
}

function unlockMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  isLocked = false;
  mainWindow.setKiosk(false);
  mainWindow.setFullScreen(false);
  mainWindow.setAlwaysOnTop(false);
  if (unlockWindow && !unlockWindow.isDestroyed()) {
    unlockWindow.close();
    unlockWindow = null;
  }
}

function registerUnlockShortcut(config) {
  const shortcut = config.unlockShortcut || 'CommandOrControl+Alt+L';
  try {
    globalShortcut.unregister(shortcut);
  } catch (_) {}
  globalShortcut.register(shortcut, () => {
    if (isLocked) {
      if (config.unlockPassword) {
        showUnlockWindow(config);
      } else {
        unlockMainWindow();
      }
    } else {
      lockMainWindow();
    }
  });
}

ipcMain.on('quit-app', () => {
  allowClose = true;
  app.quit();
});

ipcMain.on('shutdown', () => {
  allowClose = true;
  const { exec } = require('child_process');
  const cmd = process.platform === 'win32'
    ? 'shutdown /s /t 5'
    : process.platform === 'darwin'
      ? 'sudo shutdown -h now'
      : 'sudo shutdown -h now';
  exec(cmd, (err) => {
    if (err) console.error('Shutdown error:', err);
  });
  app.quit();
});

ipcMain.on('save-group-id', (_, groupId) => {
  saveConfigUpdate({ groupId: groupId || '' });
});

ipcMain.on('unlock-password', (event, password) => {
  const config = loadConfig();
  const ok = config.unlockPassword && password === config.unlockPassword;
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.webContents.send('unlock-result', { success: ok, error: ok ? null : 'Неверный пароль' });
  if (ok) unlockMainWindow();
});

app.whenReady().then(() => {
  createWindow();
  const config = loadConfig();
  registerUnlockShortcut(config);
});

app.on('before-quit', (e) => {
  if (!allowClose) {
    e.preventDefault();
  }
});

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  if (!allowClose) return;
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
