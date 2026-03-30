import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { ChatMessage } from '@allstak/shared'

export function useChatSocket(channelId: string | undefined) {
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!channelId) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/api/v1/chat/ws?channelId=${channelId}`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => setIsConnected(true)

    ws.onmessage = (event) => {
      try {
        const msg: ChatMessage = JSON.parse(event.data)
        // Append the new message to the query cache
        queryClient.setQueryData<ChatMessage[]>(
          ['chat-messages', channelId],
          (old) => (old ? [...old, msg] : [msg]),
        )
      } catch {
        // ignore malformed
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
      wsRef.current = null
    }

    ws.onerror = () => setIsConnected(false)

    return () => {
      ws.close()
      wsRef.current = null
      setIsConnected(false)
    }
  }, [channelId, queryClient])

  return { isConnected }
}
