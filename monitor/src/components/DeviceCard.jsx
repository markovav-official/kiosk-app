import { useState } from 'react'
import { api } from '../api/client'

export function DeviceCard({ client, media, groups, onRefresh, onOpenDetail }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(null)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(client.display_name ?? client.hostname ?? '')
  const [editGroupId, setEditGroupId] = useState(client.group_id ?? '')

  const screenSrc = media?.screen ? `data:image/jpeg;base64,${media.screen}` : null
  const cameraSrc = media?.camera ? `data:image/jpeg;base64,${media.camera}` : null
  const displayName = client.display_name || client.hostname
  const connected = client.connected !== false

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

  async function saveEdit() {
    setLoading('edit')
    try {
      await api.updateClient(client.client_id, {
        display_name: editName.trim() || null,
        group_id: editGroupId || null,
      })
      setEditing(false)
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
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="font-medium text-slate-200 truncate" title={displayName}>
            {displayName}
          </span>
          {!connected && (
            <span className="text-xs px-2 py-0.5 rounded bg-amber-600/80 text-white shrink-0">
              offline
            </span>
          )}
        </div>
        {client.group_id && (
          <span className="text-xs px-2 py-0.5 rounded bg-slate-600 text-slate-300 shrink-0">
            {client.group_id}
          </span>
        )}
      </div>
      {editing ? (
        <div className="p-2 space-y-2 border-b border-slate-700">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Имя"
            className="w-full rounded px-2 py-1 bg-slate-700 text-slate-200 text-sm border border-slate-600"
          />
          <select
            value={editGroupId}
            onChange={(e) => setEditGroupId(e.target.value)}
            className="w-full rounded px-2 py-1 bg-slate-700 text-slate-200 text-sm border border-slate-600"
          >
            <option value="">— без группы —</option>
            {groups?.map((g) => (
              <option key={g.group_id} value={g.group_id}>
                {g.name || g.group_id}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={saveEdit}
              disabled={loading === 'edit'}
              className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-sm"
            >
              Сохранить
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-3 py-1 rounded bg-slate-600 hover:bg-slate-500 text-white text-sm"
            >
              Отмена
            </button>
          </div>
        </div>
      ) : null}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 p-2">
        <div
          className="aspect-video bg-black rounded overflow-hidden relative cursor-pointer group"
          onClick={() => onOpenDetail?.(client)}
          title="Открыть в полном экране"
        >
          {screenSrc ? (
            <img src={screenSrc} alt="Screen" className="w-full h-full object-contain" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
              Экран
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-colors">
            <span className="opacity-0 group-hover:opacity-100 text-white text-sm">↗ Полный экран</span>
          </div>
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
        <button
          onClick={() => {
            if (!editing) {
              setEditName(client.display_name ?? client.hostname ?? '')
              setEditGroupId(client.group_id ?? '')
            }
            setEditing(!editing)
          }}
          className="px-3 py-1 rounded bg-slate-600 hover:bg-slate-500 text-white text-sm"
        >
          {editing ? 'Закрыть' : 'Изменить имя/группу'}
        </button>
        {onOpenDetail && (
          <button
            onClick={() => onOpenDetail(client)}
            className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-sm"
          >
            Полный экран
          </button>
        )}
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
