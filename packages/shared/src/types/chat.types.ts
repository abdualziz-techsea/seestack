export interface ChatChannel {
  id: string
  orgId: string
  name: string
  description?: string
  isDefault: boolean
  isPrivate?: boolean
  createdAt: string
  unreadCount?: number
}

export interface MessageReaction {
  emoji: string
  count: number
  userIds: string[]
}

export interface LinkedError {
  fingerprint: string
  exceptionClass: string
  message: string
  environment: string
  status: string
  occurrences: number
}

export interface ChatMessage {
  id: string
  channelId: string
  userId: string
  userName: string
  content: string
  linkedErrorId?: string | null
  linkedError?: LinkedError
  reactions?: MessageReaction[]
  isPinned?: boolean
  editedAt?: string | null
  createdAt: string
}
