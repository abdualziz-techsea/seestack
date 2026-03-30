import { useState, useEffect, useCallback, useRef } from 'react'
import { notificationsApi } from '@allstak/shared'
import type { NotificationItem } from '@allstak/shared'

const POLL_INTERVAL_MS = 30_000

interface UseNotificationsResult {
  notifications: NotificationItem[]
  unreadCount: number
  loading: boolean
  error: string | null
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  refresh: () => void
}

export function useNotifications(projectId: string | undefined): UseNotificationsResult {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetch = useCallback(async (showLoading = false) => {
    if (!projectId) return
    if (showLoading) setLoading(true)
    setError(null)
    try {
      const [listRes, countRes] = await Promise.all([
        notificationsApi.list(projectId, 1, 20),
        notificationsApi.unreadCount(projectId),
      ])
      setNotifications(listRes.data.items ?? [])
      setUnreadCount((countRes.data as unknown as { count: number }).count ?? 0)
    } catch {
      setError('Failed to load notifications')
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetch(true)
    timerRef.current = setInterval(() => fetch(false), POLL_INTERVAL_MS)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [fetch])

  const markRead = useCallback(async (id: string) => {
    try {
      await notificationsApi.markRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch {
      // silent
    }
  }, [])

  const markAllRead = useCallback(async () => {
    if (!projectId) return
    try {
      await notificationsApi.markAllRead(projectId)
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch {
      // silent
    }
  }, [projectId])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markRead,
    markAllRead,
    refresh: () => fetch(true),
  }
}
