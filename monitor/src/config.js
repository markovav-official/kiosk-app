/**
 * Config from env (Vite: VITE_* only).
 * Token is read from localStorage; env is only fallback at first load.
 */
const AUTH_STORAGE_KEY = 'kiosk_monitor_token'

export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:8000/kiosk-api/ws/monitor',
}

export function getAuthToken() {
  if (typeof localStorage === 'undefined') return ''
  return localStorage.getItem(AUTH_STORAGE_KEY) || import.meta.env.VITE_AUTH_TOKEN || ''
}

export function setAuthToken(token) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(AUTH_STORAGE_KEY, token)
}

export function clearAuthToken() {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

export function wsUrlWithToken(token) {
  const t = token !== undefined ? token : getAuthToken()
  const u = new URL(config.wsUrl)
  if (t) u.searchParams.set('token', t)
  return u.toString()
}

export function apiHeaders() {
  const h = { 'Content-Type': 'application/json' }
  const token = getAuthToken()
  if (token) h['X-Token'] = token
  return h
}
