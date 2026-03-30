export interface NotificationItem {
  id: string
  alertRuleId: string
  projectId: string
  triggerType: string
  channelType: string
  status: string
  errorMessage: string | null
  sentAt: string
  isRead: boolean
}

export interface NotificationListResponse {
  items: NotificationItem[]
  pagination: {
    page: number
    perPage: number
    total: number
  }
}

export interface UnreadCountResponse {
  count: number
}
