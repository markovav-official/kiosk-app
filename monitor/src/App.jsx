import { useCallback, useEffect, useState } from 'react'
import { useWebSocket } from './hooks/useWebSocket'
import { GroupSidebar } from './components/GroupSidebar'
import { GroupPanel } from './components/GroupPanel'
import { DeviceCard } from './components/DeviceCard'
import { DeviceDetailView } from './components/DeviceDetailView'
import { api } from './api/client'

function App() {
  const [clients, setClients] = useState([])
  const [groups, setGroups] = useState([])
  const [media, setMedia] = useState({}) // client_id -> { screen, camera, audio }
  const [selectedGroupId, setSelectedGroupId] = useState(null)
  const [selectedClientId, setSelectedClientId] = useState(null)

  const refresh = useCallback(async () => {
    try {
      const [c, g] = await Promise.all([api.getClients(), api.getGroups()])
      setClients(c.clients || [])
      setGroups(g.groups || [])
    } catch (e) {
      console.error(e)
    }
  }, [])

  const onWsMessage = useCallback((msg) => {
    if (msg.type === 'clients_list' && msg.payload?.clients) {
      setClients(msg.payload.clients)
    }
    if (msg.type === 'groups_list' && msg.payload?.groups) {
      setGroups(msg.payload.groups)
    }
    if (msg.type === 'media' && msg.payload?.client_id) {
      const { client_id, kind, data } = msg.payload
      setMedia((prev) => ({
        ...prev,
        [client_id]: {
          ...(prev[client_id] || {}),
          [kind]: data,
        },
      }))
    }
    if (msg.type === 'client_updated' && msg.payload?.client_id) {
      setClients((prev) =>
        prev.map((c) =>
          c.client_id === msg.payload.client_id
            ? { ...c, current_url: msg.payload.current_url }
            : c
        )
      )
    }
    if (msg.type === 'client_disconnected' && msg.payload?.client_id) {
      setClients((prev) =>
        prev.map((c) =>
          c.client_id === msg.payload.client_id ? { ...c, connected: false } : c
        )
      )
    }
  }, [])

  useWebSocket(onWsMessage)

  useEffect(() => {
    refresh()
  }, [refresh])

  const filteredClients = selectedGroupId
    ? clients.filter((c) => {
        const g = groups.find((gr) => gr.group_id === selectedGroupId)
        return g?.client_ids?.includes(c.client_id)
      })
    : clients

  const selectedGroup = groups.find((g) => g.group_id === selectedGroupId)
  const selectedClient = selectedClientId
    ? clients.find((c) => c.client_id === selectedClientId)
    : null

  if (selectedClient && selectedClientId) {
    return (
      <DeviceDetailView
        client={selectedClient}
        media={media[selectedClientId]}
        groups={groups}
        onBack={() => setSelectedClientId(null)}
        onRefresh={refresh}
      />
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex">
      <GroupSidebar
        groups={groups}
        selectedGroupId={selectedGroupId}
        onSelectGroup={setSelectedGroupId}
        onRefresh={refresh}
      />
      <main className="flex-1 overflow-auto p-4">
        <div className="flex items-center gap-4 mb-4">
          <h1 className="text-xl font-semibold">Монитор киосков</h1>
          <span className="text-sm text-slate-400">Устройств: {clients.length}</span>
        </div>

        {selectedGroup && (
          <div className="mb-6">
            <GroupPanel
              group={selectedGroup}
              clients={clients}
              mediaByClientId={media}
              onRefresh={refresh}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <DeviceCard
              key={client.client_id}
              client={client}
              media={media[client.client_id]}
              groups={groups}
              onRefresh={refresh}
              onOpenDetail={(c) => setSelectedClientId(c.client_id)}
            />
          ))}
        </div>
        {filteredClients.length === 0 && (
          <p className="text-slate-500">Нет подключённых устройств.</p>
        )}
      </main>
    </div>
  )
}

export default App
