/**
 * Handle commands from backend: open_url, close_site, close_app, shutdown.
 */

export function handleCommand(data, handlers) {
  const { onOpenUrl, onCloseSite, onCloseApp, onShutdown } = handlers;
  switch (data.type) {
    case 'open_url':
      if (data.url && onOpenUrl) onOpenUrl(data.url);
      break;
    case 'close_site':
      if (onCloseSite) onCloseSite();
      break;
    case 'close_app':
      if (onCloseApp) onCloseApp();
      break;
    case 'shutdown':
      if (onShutdown) onShutdown();
      break;
    default:
      break;
  }
}
