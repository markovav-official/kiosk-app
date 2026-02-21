import { useState, useRef, useEffect } from 'react'
import { api } from '../api/client'

export function DeviceCard({ client, media, groups, onRefresh, onOpenDetail }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(client.display_name ?? client.hostname ?? '')
  const [editGroupId, setEditGroupId] = useState(client.group_id ?? '')
  const menuRef = useRef(null)

  const screenSrc = media?.screen ? `data:image/jpeg;base64,${media.screen}` : null
  const cameraSrc = media?.camera ? `data:image/jpeg;base64,${media.camera}` : null
  const displayName = client.display_name || client.hostname
  const connected = client.connected !== false

  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

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

  function openEditForm() {
    setEditName(client.display_name ?? client.hostname ?? '')
    setEditGroupId(client.group_id ?? '')
    setEditing(true)
  }

  return (
    <div className="rounded-xl bg-slate-800/80 border border-slate-700 shadow-lg overflow-visible">
      {/* Header: name + group badge + menu */}
      <div className="p-2 border-b border-slate-700 flex items-center gap-2 overflow-visible">
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
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
            title="Действия"
            aria-label="Меню"
          >
            <span className="text-lg leading-none font-medium">⋯</span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 z-[100] w-80 max-h-[70vh] overflow-y-auto rounded-lg border border-slate-600 bg-slate-800 shadow-xl p-3 space-y-3">
              {/* Open URL */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Открыть URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1 min-w-0 rounded-lg px-3 py-2 bg-slate-700 text-slate-200 text-sm border border-slate-600 placeholder-slate-500"
                  />
                  <button
                    onClick={() => doAction('openUrl')}
                    disabled={loading || !url.trim()}
                    className="shrink-0 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm"
                  >
                    Открыть
                  </button>
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex flex-wrap gap-2">
                {onOpenDetail && (
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      onOpenDetail(client)
                    }}
                    className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm"
                  >
                    Полный экран
                  </button>
                )}
                <button
                  onClick={() => {
                    if (!editing) openEditForm()
                    else setEditing(false)
                  }}
                  className="px-3 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-white text-sm"
                >
                  {editing ? 'Отмена' : 'Имя / группа'}
                </button>
              </div>

              {/* Edit form inline */}
              {editing && (
                <div className="space-y-2 pt-2 border-t border-slate-600">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Имя устройства"
                    className="w-full rounded-lg px-3 py-2 bg-slate-700 text-slate-200 text-sm border border-slate-600"
                  />
                  <select
                    value={editGroupId}
                    onChange={(e) => setEditGroupId(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 bg-slate-700 text-slate-200 text-sm border border-slate-600"
                  >
                    <option value="">— без группы —</option>
                    {groups?.map((g) => (
                      <option key={g.group_id} value={g.group_id}>
                        {g.name || g.group_id}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={saveEdit}
                    disabled={loading === 'edit'}
                    className="w-full px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm"
                  >
                    Сохранить
                  </button>
                </div>
              )}

              {/* Danger / control actions */}
              <div className="pt-2 border-t border-slate-600 space-y-1">
                <button
                  onClick={() => doAction('closeSite')}
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm text-left"
                >
                  Закрыть сайт
                </button>
                <button
                  onClick={() => doAction('closeApp')}
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm text-left"
                >
                  Закрыть клиент
                </button>
                <button
                  onClick={() => doAction('shutdown')}
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-white text-sm text-left"
                >
                  Выключить ПК
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview: screen + camera only */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 p-2 overflow-hidden rounded-b-xl">
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
        <div className="px-2 pb-2 text-xs text-slate-400 truncate" title={client.current_url}>
          {client.current_url}
        </div>
      )}
    </div>
  )
}
