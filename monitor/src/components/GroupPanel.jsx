import { useState } from 'react'
import { api } from '../api/client'

export function GroupPanel({ group, clients, mediaByClientId, onRefresh }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(null)

  const groupClients = clients.filter((c) => c.client_id && group.client_ids?.includes(c.client_id))

  async function doGroupAction(action, arg) {
    setLoading(action)
    try {
      if (action === 'openUrl') await api.groupOpenUrl(group.group_id, arg || url)
      else if (action === 'closeSite') await api.groupCloseSite(group.group_id)
      else if (action === 'closeApp') await api.groupCloseApp(group.group_id)
      else if (action === 'shutdown') await api.groupShutdown(group.group_id)
      onRefresh?.()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="rounded-xl bg-slate-800/60 border border-slate-600 p-4">
      <h3 className="text-lg font-semibold text-slate-200 mb-3">{group.name || group.group_id}</h3>
      <p className="text-sm text-slate-400 mb-3">Клиентов в группе: {groupClients.length}</p>
      <div className="flex flex-wrap gap-2 mb-3">
        <input
          type="url"
          placeholder="URL для всех"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 min-w-[200px] rounded px-3 py-2 bg-slate-700 text-slate-200 border border-slate-600"
        />
        <button
          onClick={() => doGroupAction('openUrl')}
          disabled={loading || !url.trim()}
          className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white"
        >
          Открыть на всех
        </button>
        <button
          onClick={() => doGroupAction('closeSite')}
          disabled={loading}
          className="px-4 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white"
        >
          Закрыть сайт
        </button>
        <button
          onClick={() => doGroupAction('closeApp')}
          disabled={loading}
          className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white"
        >
          Закрыть клиент
        </button>
        <button
          onClick={() => doGroupAction('shutdown')}
          disabled={loading}
          className="px-4 py-2 rounded bg-slate-600 hover:bg-slate-500 text-white"
        >
          Выключить все ПК
        </button>
      </div>
    </div>
  )
}
