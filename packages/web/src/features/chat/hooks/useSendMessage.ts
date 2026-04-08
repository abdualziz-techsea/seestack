import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { chatApi } from '@seestack/shared'
import { useAuthStore } from '@/store/auth.store'

export function useSendMessage() {
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)

  const sendMessage = async (channelId: string, content: string) => {
    if (!content.trim() || !channelId) return
    setIsSending(true)
    setError('')

    try {
      // Backend resolves userId from JWT. We pass userName for display.
      await chatApi.sendMessage(channelId, {
        userId: user?.id ?? '00000000-0000-0000-0000-000000000000',
        userName: user?.name ?? 'User',
        content,
      })
      await queryClient.invalidateQueries({ queryKey: ['chat-messages', channelId] })
    } catch (err: any) {
      const message = err?.error?.message || err?.message || 'Failed to send message'
      setError(message)
    } finally {
      setIsSending(false)
    }
  }

  return { sendMessage, isSending, error }
}
