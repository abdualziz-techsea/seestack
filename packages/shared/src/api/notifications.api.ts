import { apiClient } from './client'
import type { NotificationItem, NotificationListResponse, UnreadCountResponse } from '../types/notification.types'

export const notificationsApi = {
  list: (projectId: string, page = 1, perPage = 20) =>
    apiClient.get<NotificationListResponse>('/api/v1/notifications', {
      params: { projectId, page, perPage },
    }),

  unreadCount: (projectId: string) =>
    apiClient.get<UnreadCountResponse>('/api/v1/notifications/unread-count', {
      params: { projectId },
    }),

  markRead: (id: string) =>
    apiClient.patch<NotificationItem>(`/api/v1/notifications/${id}/read`),

  markAllRead: (projectId: string) =>
    apiClient.patch('/api/v1/notifications/read-all', null, {
      params: { projectId },
    }),
}
