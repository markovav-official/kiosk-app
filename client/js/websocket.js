/**
 * WebSocket client with automatic reconnect and exponential backoff.
 */

const DEFAULT_RECONNECT_INTERVAL_MS = 2000;
const MAX_RECONNECT_INTERVAL_MS = 30000;
const PING_INTERVAL_MS = 15000;

export function createWsClient(options) {
  const {
    url,
    token,
    onOpen,
    onMessage,
    onClose,
    onError,
    reconnectIntervalMs = DEFAULT_RECONNECT_INTERVAL_MS,
    maxReconnectIntervalMs = MAX_RECONNECT_INTERVAL_MS,
  } = options;

  let ws = null;
  let reconnectTimer = null;
  let pingTimer = null;
  let currentInterval = reconnectIntervalMs;
  let intentionalClose = false;

  function buildUrl() {
    const u = new URL(url);
    if (token) u.searchParams.set('token', token);
    return u.toString();
  }

  function clearPing() {
    if (pingTimer) {
      clearInterval(pingTimer);
      pingTimer = null;
    }
  }

  function scheduleReconnect() {
    if (intentionalClose) return;
    reconnectTimer = setTimeout(connect, currentInterval);
    currentInterval = Math.min(currentInterval * 2, maxReconnectIntervalMs);
  }

  function connect() {
    intentionalClose = false;
    try {
      ws = new WebSocket(buildUrl());
    } catch (e) {
      onError?.(e);
      scheduleReconnect();
      return;
    }

    ws.onopen = () => {
      currentInterval = reconnectIntervalMs;
      clearPing();
      pingTimer = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, PING_INTERVAL_MS);
      onOpen?.();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
          return;
        }
        onMessage?.(data);
      } catch (e) {
        onMessage?.(event.data);
      }
    };

    ws.onclose = (event) => {
      clearPing();
      ws = null;
      onClose?.(event);
      if (!intentionalClose) scheduleReconnect();
    };

    ws.onerror = (event) => {
      onError?.(event);
    };
  }

  function send(data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(typeof data === 'string' ? data : JSON.stringify(data));
    }
  }

  function close() {
    intentionalClose = true;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    clearPing();
    if (ws) {
      ws.close();
      ws = null;
    }
  }

  connect();
  return { send, close, reconnect: () => { currentInterval = reconnectIntervalMs; connect(); } };
}
