import { useEffect } from 'react';

export function BrowserView({ webviewRef, initialUrl, onNavigate }) {
  useEffect(() => {
    const wv = webviewRef.current;
    if (!wv || !initialUrl) return;
    wv.src = initialUrl;
  }, [webviewRef, initialUrl]);

  useEffect(() => {
    const wv = webviewRef.current;
    if (!wv) return;
    const handler = (e) => {
      if (e.url && e.url !== 'about:blank') onNavigate?.(e.url);
    };
    wv.addEventListener('did-navigate', handler);
    return () => wv.removeEventListener('did-navigate', handler);
  }, [webviewRef, onNavigate]);

  return (
    <div className="fixed inset-0 w-full h-full bg-black z-[5]">
      <webview
        ref={webviewRef}
        allowpopups="no"
        className="absolute inset-0 w-full h-full border-0 m-0 p-0"
      />
    </div>
  );
}
