import { apiClient } from './client'
import type { ChatChannel, ChatMessage } from '../types/chat.types'

export interface SendMessageRequest {
  userId: string
  userName: string
  content: string
  linkedErrorId?: string
}

export const chatApi = {
  listChannels: (orgId: string) =>
    apiClient.get<{ items: ChatChannel[]; pagination: unknown }>('/api/v1/chat/channels', { params: { orgId } }),

  createChannel: (orgId: string, name: string) =>
    apiClient.post<ChatChannel>('/api/v1/chat/channels', { orgId, name }),

  deleteChannel: (channelId: string) =>
    apiClient.delete(`/api/v1/chat/channels/${channelId}`),

  createDefaults: (orgId: string) =>
    apiClient.post('/api/v1/chat/channels/defaults', null, { params: { orgId } }),

  listMessages: (channelId: string, page?: number) =>
    apiClient.get<{ items: ChatMessage[]; pagination: unknown }>(`/api/v1/chat/channels/${channelId}/messages`, {
      params: { page },
    }),

  sendMessage: (channelId: string, data: SendMessageRequest) =>
    apiClient.post<ChatMessage>(`/api/v1/chat/channels/${channelId}/messages`, data),

  editMessage: (messageId: string, content: string) =>
    apiClient.patch<ChatMessage>(`/api/v1/chat/messages/${messageId}`, { content }),

  deleteMessage: (messageId: string) =>
    apiClient.delete(`/api/v1/chat/messages/${messageId}`),

  addReaction: (messageId: string, emoji: string) =>
    apiClient.post(`/api/v1/chat/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`),

  removeReaction: (messageId: string, emoji: string) =>
    apiClient.delete(`/api/v1/chat/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`),

  pinMessage: (messageId: string) =>
    apiClient.patch(`/api/v1/chat/messages/${messageId}/pin`),

  getPinnedMessages: (channelId: string) =>
    apiClient.get<ChatMessage[]>(`/api/v1/chat/channels/${channelId}/pinned`),

  searchMessages: (orgId: string, q: string) =>
    apiClient.get<ChatMessage[]>('/api/v1/chat/search', { params: { orgId, q } }),

  markRead: (channelId: string) =>
    apiClient.put(`/api/v1/chat/channels/${channelId}/read`),

  listChannelMembers: (channelId: string) =>
    apiClient.get<{ id: string; userName: string; channelId: string; joinedAt: string }[]>(
      `/api/v1/chat/channels/${channelId}/members`,
    ),

  addChannelMember: (channelId: string, userId: string, userName: string) =>
    apiClient.post(`/api/v1/chat/channels/${channelId}/members`, { userId, userName }),

  removeChannelMember: (channelId: string, userId: string) =>
    apiClient.delete(`/api/v1/chat/channels/${channelId}/members/${userId}`),

  listOrgMembers: (orgId: string) =>
    apiClient.get<{ id: string; email: string; userName: string }[]>('/api/v1/chat/members', { params: { orgId } }),
}
