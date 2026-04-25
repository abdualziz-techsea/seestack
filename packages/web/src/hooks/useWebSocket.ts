import { useEffect, useRef, useCallback, useState } from 'react'

interface UseWebSocketOptions {
  url: string
  onMessage: (data: unknown) => void
  onOpen?: () => void
  onClose?: () => void
  enabled?: boolean
}

export function useWebSocket({ url, onMessage, onOpen, onClose, enabled = true }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null)
  const retriesRef = useRef(0)
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<unknown>(null)

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    let unmounted = false

    const connect = () => {
      if (unmounted) return

      const wsUrl = `${import.meta.env.VITE_WS_URL ?? 'ws://localhost:8082'}${url}`
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        retriesRef.current = 0
        setIsConnected(true)
        onOpen?.()
      }

      ws.onclose = () => {
        setIsConnected(false)
        onClose?.()

        // Exponential backoff reconnect
        if (!unmounted) {
          const delay = Math.min(1000 * 2 ** retriesRef.current, 30_000)
          retriesRef.current++
          setTimeout(connect, delay)
        }
      }

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        setLastMessage(data)
        onMessage(data)
      }
    }

    connect()

    return () => {
      unmounted = true
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [url, enabled])

  return { send, isConnected, lastMessage }
}
