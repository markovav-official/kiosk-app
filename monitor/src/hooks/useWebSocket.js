import { useEffect, useRef, useState } from 'react'
import { wsUrlWithToken } from '../config'

export function useWebSocket(onMessage, authToken) {
  const [connected, setConnected] = useState(false)
  const [connectionFailed, setConnectionFailed] = useState(false)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage
  const generationRef = useRef(0)
  const closedByUsRef = useRef(false)

  useEffect(() => {
    if (!authToken) {
      setConnected(false)
      setConnectionFailed(false)
      return
    }
    setConnectionFailed(false)
    closedByUsRef.current = false
    generationRef.current += 1
    const myId = generationRef.current
    const url = wsUrlWithToken(authToken)
    const ws = new WebSocket(url)
    let opened = false

    ws.onopen = () => {
      opened = true
      setConnected(true)
    }
    ws.onclose = () => {
      // Ignore close from a stale socket (e.g. previous effect run in Strict Mode)
      if (myId !== generationRef.current) return
      // Ignore close we triggered ourselves in cleanup
      if (closedByUsRef.current) return
      if (!opened) setConnectionFailed(true)
      setConnected(false)
    }
    ws.onerror = () => {
      if (myId !== generationRef.current) return
      if (closedByUsRef.current) return
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
      closedByUsRef.current = true
      ws.close()
    }
  }, [authToken])

  return { connected, connectionFailed }
}
