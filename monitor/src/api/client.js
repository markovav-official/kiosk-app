import { config, apiHeaders } from '../config'

const base = config.apiUrl

async function request(path, options = {}) {
  const url = path.startsWith('http') ? path : `${base}${path}`
  const res = await fetch(url, {
    ...options,
    headers: { ...apiHeaders(), ...options.headers },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || res.statusText)
  }
  const contentType = res.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) return res.json()
  return res.text()
}

export const api = {
  getClients: () => request('/api/clients'),
  getGroups: () => request('/api/groups'),
  createGroup: (body) => request('/api/groups', { method: 'POST', body: JSON.stringify(body) }),
  openUrl: (clientId, url) =>
    request(`/api/clients/${clientId}/open_url`, { method: 'POST', body: JSON.stringify({ url }) }),
  closeSite: (clientId) => request(`/api/clients/${clientId}/close_site`, { method: 'POST' }),
  closeApp: (clientId) => request(`/api/clients/${clientId}/close_app`, { method: 'POST' }),
  shutdown: (clientId) => request(`/api/clients/${clientId}/shutdown`, { method: 'POST' }),
  groupOpenUrl: (groupId, url) =>
    request(`/api/groups/${groupId}/open_url`, { method: 'POST', body: JSON.stringify({ url }) }),
  groupCloseSite: (groupId) => request(`/api/groups/${groupId}/close_site`, { method: 'POST' }),
  groupCloseApp: (groupId) => request(`/api/groups/${groupId}/close_app`, { method: 'POST' }),
  groupShutdown: (groupId) => request(`/api/groups/${groupId}/shutdown`, { method: 'POST' }),
  updateClient: (clientId, body) =>
    request(`/api/clients/${clientId}`, { method: 'PATCH', body: JSON.stringify(body) }),
}
