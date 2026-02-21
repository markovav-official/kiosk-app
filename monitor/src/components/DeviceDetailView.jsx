import { useState, useRef, useEffect } from 'react'
import { api } from '../api/client'

export function DeviceDetailView({ client, media, groups, onBack, onRefresh }) {
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
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
      <header className="shrink-0 flex items-center justify-between gap-4 p-3 bg-slate-900 border-b border-slate-700">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium"
        >
          ← Назад к списку
        </button>
        <h1 className="text-lg font-semibold text-slate-200 truncate flex-1 text-center">
          {displayName}
        </h1>
        <div className="relative w-12 flex justify-end" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
            title="Действия"
            aria-label="Меню"
          >
            <span className="text-xl leading-none font-medium">⋯</span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 z-[100] w-80 max-h-[70vh] overflow-y-auto rounded-lg border border-slate-600 bg-slate-800 shadow-xl p-3 space-y-3">
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
              <div>
                <button
                  onClick={() => {
                    if (!editing) openEditForm()
                    else setEditing(false)
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-white text-sm text-left"
                >
                  {editing ? 'Отмена' : 'Имя / группа'}
                </button>
              </div>
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
                    {(groups || []).map((g) => (
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
      </header>
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-2 p-2 min-h-0">
        <div className="lg:col-span-2 flex flex-col min-h-0 rounded-lg overflow-hidden bg-black">
          <div className="text-sm text-slate-400 px-2 py-1">Экран</div>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            {screenSrc ? (
              <img
                src={screenSrc}
                alt="Экран"
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <span className="text-slate-500">Нет сигнала</span>
            )}
          </div>
        </div>
        <div className="flex flex-col min-h-0 rounded-lg overflow-hidden bg-black">
          <div className="text-sm text-slate-400 px-2 py-1">Камера</div>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            {cameraSrc ? (
              <img
                src={cameraSrc}
                alt="Камера"
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <span className="text-slate-500">Нет сигнала</span>
            )}
          </div>
        </div>
      </div>
      {client.current_url && (
        <div className="shrink-0 px-3 py-1 text-xs text-slate-400 truncate bg-slate-900">
          {client.current_url}
        </div>
      )}
    </div>
  )
}
