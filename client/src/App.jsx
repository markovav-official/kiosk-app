import { useCallback, useEffect, useRef, useState } from 'react';
import { createWsClient } from '../js/websocket.js';
import { startScreenCapture, startCameraCapture, startAudioCapture, stopAllCapture } from '../js/capture.js';
import { handleCommand } from '../js/commands.js';
import { WaitingScreen } from './WaitingScreen.jsx';
import { BrowserView } from './BrowserView.jsx';

function App() {
  const [config, setConfig] = useState(null);
  const [connected, setConnected] = useState(false);
  const [showBrowser, setShowBrowser] = useState(false);
  const [browserUrl, setBrowserUrl] = useState(null);
  const [currentUrl, setCurrentUrl] = useState(null);
  const wsClientRef = useRef(null);
  const webviewRef = useRef(null);

  const sendMedia = useCallback((kind, data, mime) => {
    if (wsClientRef.current) {
      wsClientRef.current.send({ type: 'media', kind, data, mime });
    }
  }, []);

  const reportCurrentUrl = useCallback((url) => {
    setCurrentUrl(url);
    if (wsClientRef.current) {
      wsClientRef.current.send({ type: 'current_url', url });
    }
  }, []);

  const onOpenUrl = useCallback((url) => {
    setBrowserUrl(url);
    setShowBrowser(true);
    reportCurrentUrl(url);
  }, [reportCurrentUrl]);

  const onCloseSite = useCallback(() => {
    if (webviewRef.current) {
      webviewRef.current.src = 'about:blank';
    }
    setShowBrowser(false);
    reportCurrentUrl(null);
  }, [reportCurrentUrl]);

  const onCloseApp = useCallback(() => {
    window.electronAPI?.quitApp?.();
  }, []);

  const onShutdown = useCallback(() => {
    window.electronAPI?.shutdown?.();
  }, []);

  const onSetGroup = useCallback((groupId) => {
    setConfig((c) => (c ? { ...c, groupId: groupId || '' } : c));
    window.electronAPI?.saveGroupId?.(groupId || '');
  }, []);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api?.onConfig) return;
    api.onConfig((cfg) => {
      setConfig(cfg);
    });
  }, []);

  useEffect(() => {
    if (!config) return;
    const url = config.backendWsUrl || 'ws://localhost:8000/ws/client';
    const token = config.authToken || '';

    const client = createWsClient({
      url,
      token,
      onOpen: () => {
        setConnected(true);
        client.send({
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
          client.send({ type: 'pong' });
          return;
        }
        handleCommand(data, {
          onOpenUrl,
          onCloseSite,
          onCloseApp,
          onShutdown,
          onSetGroup,
        });
      },
      onClose: () => {
        stopAllCapture();
        setConnected(false);
      },
      onError: () => setConnected(false),
    });
    wsClientRef.current = client;
    return () => {
      client.close();
      wsClientRef.current = null;
    };
  }, [config, sendMedia, onOpenUrl, onCloseSite, onSetGroup]);

  if (showBrowser) {
    return (
      <BrowserView
        webviewRef={webviewRef}
        initialUrl={browserUrl}
        onNavigate={reportCurrentUrl}
      />
    );
  }

  return <WaitingScreen connected={connected} />;
}

export default App;
