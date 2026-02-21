import { useState } from 'react'
import { api } from '../api/client'

export function GroupSidebar({ groups, selectedGroupId, onSelectGroup, onRefresh }) {
  const [showCreate, setShowCreate] = useState(false)
  const [newGroupId, setNewGroupId] = useState('')
  const [newGroupName, setNewGroupName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)

  async function handleCreateGroup(e) {
    e.preventDefault()
    const id = newGroupId.trim()
    const name = newGroupName.trim() || id
    if (!id) {
      setError('Введите идентификатор группы')
      return
    }
    setError(null)
    setCreating(true)
    try {
      await api.createGroup({ group_id: id, name: name || id })
      setNewGroupId('')
      setNewGroupName('')
      setShowCreate(false)
      onRefresh?.()
    } catch (err) {
      setError(err.message || 'Ошибка создания группы')
    } finally {
      setCreating(false)
    }
  }

  return (
    <aside className="w-56 shrink-0 bg-slate-900 border-r border-slate-700 flex flex-col">
      <div className="p-3 border-b border-slate-700 flex items-center justify-between gap-2">
        <h2 className="text-slate-300 font-semibold">Группы</h2>
        <button
          type="button"
          onClick={() => setShowCreate((s) => !s)}
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
          title="Создать группу"
        >
          +
        </button>
      </div>
      {showCreate && (
        <form onSubmit={handleCreateGroup} className="p-2 border-b border-slate-700 space-y-2">
          <input
            type="text"
            value={newGroupId}
            onChange={(e) => setNewGroupId(e.target.value)}
            placeholder="ID группы"
            className="w-full rounded-lg px-2 py-1.5 bg-slate-800 text-slate-200 text-sm border border-slate-600 placeholder-slate-500"
          />
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Название (необязательно)"
            className="w-full rounded-lg px-2 py-1.5 bg-slate-800 text-slate-200 text-sm border border-slate-600 placeholder-slate-500"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating || !newGroupId.trim()}
              className="flex-1 px-2 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm"
            >
              Создать
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-2 py-1.5 rounded-lg bg-slate-600 hover:bg-slate-500 text-white text-sm"
            >
              Отмена
            </button>
          </div>
        </form>
      )}
      <nav className="p-2 flex-1 overflow-auto">
        <button
          onClick={() => onSelectGroup(null)}
          className={`w-full text-left px-3 py-2 rounded-lg mb-1 text-sm ${
            !selectedGroupId ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          Все устройства
        </button>
        {groups.map((g) => (
          <button
            key={g.group_id}
            onClick={() => onSelectGroup(g.group_id)}
            className={`w-full text-left px-3 py-2 rounded-lg mb-1 text-sm ${
              selectedGroupId === g.group_id ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            {g.name || g.group_id}
            <span className="ml-1 text-slate-500">({g.client_ids?.length ?? 0})</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
