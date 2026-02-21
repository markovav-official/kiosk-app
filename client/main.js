const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

// Load config: .env-style from config.json (or env vars for dev)
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
  };
}

let mainWindow = null;
let unlockWindow = null;
let isLocked = true;

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
    width: 340,
    height: 220,
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
  app.quit();
});

ipcMain.on('shutdown', () => {
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

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
