import { useEffect, useRef, useCallback, useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import type { LogEntry } from '@allstak/shared'

const MAX_LIVE_LOGS = 200

interface UseLiveLogsOptions {
  enabled: boolean
  paused: boolean
}

export function useLiveLogs({ enabled, paused }: UseLiveLogsOptions) {
  const currentProject = useAuthStore((s) => s.currentProject)
  const [liveLogs, setLiveLogs] = useState<LogEntry[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const pausedRef = useRef(paused)
  const bufferRef = useRef<LogEntry[]>([])

  // Keep paused ref in sync without re-triggering WS connection
  pausedRef.current = paused

  const clearLogs = useCallback(() => {
    setLiveLogs([])
    bufferRef.current = []
  }, [])

  useEffect(() => {
    if (!enabled || !currentProject?.id) {
      // Close any existing connection when disabled
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      setIsConnected(false)
      return
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/api/v1/logs/tail?projectId=${currentProject.id}`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        const logEntry: LogEntry = {
          id: data.id,
          projectId: currentProject.id,
          level: data.level,
          message: data.message,
          service: data.service || '',
          timestamp: data.timestamp,
        }

        if (pausedRef.current) {
          // Buffer while paused, cap at MAX_LIVE_LOGS
          bufferRef.current = [logEntry, ...bufferRef.current].slice(0, MAX_LIVE_LOGS)
        } else {
          setLiveLogs((prev) => [logEntry, ...prev].slice(0, MAX_LIVE_LOGS))
        }
      } catch {
        // ignore malformed messages
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
      wsRef.current = null
    }

    ws.onerror = () => {
      setIsConnected(false)
    }

    return () => {
      ws.close()
      wsRef.current = null
      setIsConnected(false)
    }
  }, [enabled, currentProject?.id])

  // When unpaused, flush the buffer
  useEffect(() => {
    if (!paused && bufferRef.current.length > 0) {
      setLiveLogs((prev) => [...bufferRef.current, ...prev].slice(0, MAX_LIVE_LOGS))
      bufferRef.current = []
    }
  }, [paused])

  return { liveLogs, isConnected, clearLogs }
}
