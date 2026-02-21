/**
 * Config from env (Vite: VITE_* only).
 */
export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/monitor',
  authToken: import.meta.env.VITE_AUTH_TOKEN || '',
}

export function wsUrlWithToken() {
  const u = new URL(config.wsUrl)
  if (config.authToken) u.searchParams.set('token', config.authToken)
  return u.toString()
}

export function apiHeaders() {
  const h = { 'Content-Type': 'application/json' }
  if (config.authToken) h['X-Token'] = config.authToken
  return h
}
