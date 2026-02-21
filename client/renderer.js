import { createWsClient } from './js/websocket.js';
import { startScreenCapture, startCameraCapture, startAudioCapture } from './js/capture.js';
import { handleCommand } from './js/commands.js';

const waitingEl = document.getElementById('waiting');
const browserContainer = document.getElementById('browser-container');
const webview = document.getElementById('webview');
const statusEl = document.getElementById('status');

let config = null;
let wsClient = null;

function setStatus(connected) {
  statusEl.textContent = connected ? 'Подключено к серверу' : 'Ожидание ответа от сервера…';
  statusEl.className = 'status-line ' + (connected ? 'connected' : 'disconnected');
}

function sendMedia(kind, data, mime) {
  if (wsClient) {
    wsClient.send({ type: 'media', kind, data, mime });
  }
}

function reportCurrentUrl(url) {
  if (wsClient) wsClient.send({ type: 'current_url', url });
}

function onOpenUrl(url) {
  waitingEl.style.display = 'none';
  waitingEl.style.visibility = 'hidden';
  browserContainer.style.display = 'block';
  browserContainer.style.visibility = 'visible';
  browserContainer.style.position = 'fixed';
  browserContainer.style.top = '0';
  browserContainer.style.left = '0';
  browserContainer.style.width = '100vw';
  browserContainer.style.height = '100vh';
  browserContainer.style.zIndex = '9999';
  webview.style.position = 'fixed';
  webview.style.top = '0';
  webview.style.left = '0';
  webview.style.width = '100vw';
  webview.style.height = '100vh';
  webview.style.margin = '0';
  webview.style.padding = '0';
  webview.style.border = 'none';
  webview.src = url;
  reportCurrentUrl(url);
}

function onCloseSite() {
  webview.src = 'about:blank';
  browserContainer.style.display = 'none';
  browserContainer.style.visibility = 'hidden';
  waitingEl.style.display = 'flex';
  waitingEl.style.visibility = 'visible';
  reportCurrentUrl(null);
}

function onCloseApp() {
  if (window.electronAPI && window.electronAPI.quitApp) {
    window.electronAPI.quitApp();
  }
}

function onShutdown() {
  if (window.electronAPI && window.electronAPI.shutdown) {
    window.electronAPI.shutdown();
  }
}

function initWs() {
  if (!config) return;
  const url = config.backendWsUrl || 'ws://localhost:8000/ws/client';
  const token = config.authToken || '';

  wsClient = createWsClient({
    url,
    token,
    onOpen: () => {
      setStatus(true);
      wsClient.send({
        type: 'register',
        hostname: navigator.platform || 'kiosk',
        group_id: config.groupId || null,
        device_id: config.deviceId || null,
      });
      const getScreenSourceId = window.electronAPI?.getScreenSourceId ?? null;
      startScreenCapture(sendMedia, getScreenSourceId).catch(() => {});
      startCameraCapture(sendMedia).catch(() => {});
      startAudioCapture(sendMedia).catch(() => {});
    },
    onMessage: (data) => {
      if (data.type === 'ping') {
        wsClient.send({ type: 'pong' });
        return;
      }
      function onSetGroup(groupId) {
        if (config) config.groupId = groupId || '';
        if (window.electronAPI && window.electronAPI.saveGroupId) {
          window.electronAPI.saveGroupId(groupId || '');
        }
      }
      handleCommand(data, { onOpenUrl, onCloseSite, onCloseApp, onShutdown, onSetGroup });
    },
    onClose: () => setStatus(false),
    onError: () => setStatus(false),
  });
}

webview.addEventListener('did-navigate', (e) => {
  if (e.url && e.url !== 'about:blank') reportCurrentUrl(e.url);
});

window.electronAPI?.onConfig?.((cfg) => {
  config = cfg;
  initWs();
});
