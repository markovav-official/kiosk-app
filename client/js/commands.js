/**
 * Handle commands from backend: open_url, close_site, close_app, shutdown, set_group.
 */

export function handleCommand(data, handlers) {
  const { onOpenUrl, onCloseSite, onCloseApp, onShutdown, onSetGroup } = handlers;
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
    case 'set_group':
      if (onSetGroup) onSetGroup(data.group_id != null ? data.group_id : null);
      break;
    default:
      break;
  }
}
