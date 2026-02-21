import { useState } from 'react'
import { api } from '../api/client'

export function DeviceCard({ client, media, onRefresh }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(null)

  const screenSrc = media?.screen ? `data:image/jpeg;base64,${media.screen}` : null
  const cameraSrc = media?.camera ? `data:image/jpeg;base64,${media.camera}` : null

  async function doAction(action, arg) {
    setLoading(action)
    try {
      if (action === 'openUrl') await api.openUrl(client.client_id, arg || url)
      else if (action === 'closeSite') await api.closeSite(client.client_id)
      else if (action === 'closeApp') await api.closeApp(client.client_id)
      else if (action === 'shutdown') await api.shutdown(client.client_id)
      onRefresh?.()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="rounded-xl bg-slate-800/80 border border-slate-700 overflow-hidden shadow-lg">
      <div className="p-2 border-b border-slate-700 flex items-center justify-between flex-wrap gap-2">
        <span className="font-medium text-slate-200 truncate" title={client.hostname}>
          {client.hostname}
        </span>
        {client.group_id && (
          <span className="text-xs px-2 py-0.5 rounded bg-slate-600 text-slate-300">
            {client.group_id}
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 p-2">
        <div className="aspect-video bg-black rounded overflow-hidden relative">
          {screenSrc ? (
            <img src={screenSrc} alt="Screen" className="w-full h-full object-contain" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
              Экран
            </div>
          )}
        </div>
        <div className="aspect-video bg-black rounded overflow-hidden relative">
          {cameraSrc ? (
            <img src={cameraSrc} alt="Camera" className="w-full h-full object-contain" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
              Камера
            </div>
          )}
        </div>
      </div>
      {client.current_url && (
        <div className="px-2 pb-1 text-xs text-slate-400 truncate" title={client.current_url}>
          {client.current_url}
        </div>
      )}
      <div className="p-2 flex flex-wrap gap-2">
        <input
          type="url"
          placeholder="URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 min-w-0 rounded px-2 py-1 bg-slate-700 text-slate-200 text-sm border border-slate-600"
        />
        <button
          onClick={() => doAction('openUrl')}
          disabled={loading || !url.trim()}
          className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm"
        >
          Открыть
        </button>
        <button
          onClick={() => doAction('closeSite')}
          disabled={loading}
          className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-sm"
        >
          Закрыть сайт
        </button>
        <button
          onClick={() => doAction('closeApp')}
          disabled={loading}
          className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-sm"
        >
          Закрыть клиент
        </button>
        <button
          onClick={() => doAction('shutdown')}
          disabled={loading}
          className="px-3 py-1 rounded bg-slate-600 hover:bg-slate-500 text-white text-sm"
        >
          Выключить ПК
        </button>
      </div>
    </div>
  )
}
