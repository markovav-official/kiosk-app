import { useEffect, useRef, useState } from 'react'
import { wsUrlWithToken } from '../config'

export function useWebSocket(onMessage) {
  const [connected, setConnected] = useState(false)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  useEffect(() => {
    const url = wsUrlWithToken()
    const ws = new WebSocket(url)

    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onerror = () => setConnected(false)
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        onMessageRef.current?.(data)
      } catch (_) {
        // ignore
      }
    }

    return () => {
      ws.close()
    }
  }, [])

  return { connected }
}
