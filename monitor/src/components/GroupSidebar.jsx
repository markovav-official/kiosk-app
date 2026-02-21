export function GroupSidebar({ groups, selectedGroupId, onSelectGroup }) {
  return (
    <aside className="w-56 shrink-0 bg-slate-900 border-r border-slate-700 flex flex-col">
      <h2 className="p-3 text-slate-300 font-semibold border-b border-slate-700">Группы</h2>
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
