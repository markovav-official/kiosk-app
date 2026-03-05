import { useEffect, useRef, useState } from 'react'
import { wsUrlWithToken } from '../config'

export function useWebSocket(onMessage, authToken) {
  const [connected, setConnected] = useState(false)
  const [connectionFailed, setConnectionFailed] = useState(false)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  useEffect(() => {
    if (!authToken) {
      setConnected(false)
      setConnectionFailed(false)
      return
    }
    setConnectionFailed(false)
    const url = wsUrlWithToken(authToken)
    const ws = new WebSocket(url)
    let opened = false

    ws.onopen = () => {
      opened = true
      setConnected(true)
    }
    ws.onclose = () => {
      if (!opened) setConnectionFailed(true)
      setConnected(false)
    }
    ws.onerror = () => {
      if (!opened) setConnectionFailed(true)
      setConnected(false)
    }
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
  }, [authToken])

  return { connected, connectionFailed }
}
