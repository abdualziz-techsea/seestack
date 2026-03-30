import { useMutation, useQueryClient } from '@tanstack/react-query'
import { chatApi } from '@allstak/shared'

export function useMessageActions(channelId: string | undefined) {
  const queryClient = useQueryClient()

  const invalidateMessages = () => {
    queryClient.invalidateQueries({ queryKey: ['chat-messages', channelId] })
  }

  const editMessage = useMutation({
    mutationFn: ({ messageId, content }: { messageId: string; content: string }) =>
      chatApi.editMessage(messageId, content),
    onSuccess: invalidateMessages,
  })

  const deleteMessage = useMutation({
    mutationFn: (messageId: string) => chatApi.deleteMessage(messageId),
    onSuccess: invalidateMessages,
  })

  const toggleReaction = useMutation({
    mutationFn: ({ messageId, emoji, hasReacted }: { messageId: string; emoji: string; hasReacted: boolean }) =>
      hasReacted
        ? chatApi.removeReaction(messageId, emoji)
        : chatApi.addReaction(messageId, emoji),
    onSuccess: invalidateMessages,
  })

  const togglePin = useMutation({
    mutationFn: (messageId: string) => chatApi.pinMessage(messageId),
    onSuccess: () => {
      invalidateMessages()
      queryClient.invalidateQueries({ queryKey: ['chat-pinned', channelId] })
    },
  })

  return { editMessage, deleteMessage, toggleReaction, togglePin }
}
