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
  getClients: () => request('/kiosk-api/clients'),
  getGroups: () => request('/kiosk-api/groups'),
  createGroup: (body) => request('/kiosk-api/groups', { method: 'POST', body: JSON.stringify(body) }),
  openUrl: (clientId, url) =>
    request(`/kiosk-api/clients/${clientId}/open_url`, { method: 'POST', body: JSON.stringify({ url }) }),
  closeSite: (clientId) => request(`/kiosk-api/clients/${clientId}/close_site`, { method: 'POST' }),
  closeApp: (clientId) => request(`/kiosk-api/clients/${clientId}/close_app`, { method: 'POST' }),
  shutdown: (clientId) => request(`/kiosk-api/clients/${clientId}/shutdown`, { method: 'POST' }),
  groupOpenUrl: (groupId, url) =>
    request(`/kiosk-api/groups/${groupId}/open_url`, { method: 'POST', body: JSON.stringify({ url }) }),
  groupCloseSite: (groupId) => request(`/kiosk-api/groups/${groupId}/close_site`, { method: 'POST' }),
  groupCloseApp: (groupId) => request(`/kiosk-api/groups/${groupId}/close_app`, { method: 'POST' }),
  groupShutdown: (groupId) => request(`/kiosk-api/groups/${groupId}/shutdown`, { method: 'POST' }),
  updateClient: (clientId, body) =>
    request(`/kiosk-api/clients/${clientId}`, { method: 'PATCH', body: JSON.stringify(body) }),
}
