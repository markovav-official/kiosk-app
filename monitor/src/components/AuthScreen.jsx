import { useState } from 'react'
import { setAuthToken } from '../config'

export function AuthScreen({ onAuth, error: externalError = '' }) {
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const displayError = externalError || error

  const handleSubmit = (e) => {
    e.preventDefault()
    const t = token.trim()
    if (!t) {
      setError('Введите токен')
      return
    }
    setError('')
    setAuthToken(t)
    onAuth()
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl bg-slate-800/80 border border-slate-700 p-6 shadow-xl">
        <h1 className="text-xl font-semibold text-center mb-2">Монитор киосков</h1>
        <p className="text-slate-400 text-sm text-center mb-6">Введите токен для доступа</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-slate-300 mb-1">
              Токен
            </label>
            <input
              id="token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Токен авторизации"
              className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              autoComplete="off"
              autoFocus
            />
          </div>
          {displayError && <p className="text-sm text-red-400">{displayError}</p>}
          <button
            type="submit"
            className="w-full rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium py-2 px-4 transition-colors"
          >
            Войти
          </button>
        </form>
      </div>
    </div>
  )
}
