import { useQuery } from '@tanstack/react-query'
import { chatApi } from '@allstak/shared'
import type { ChatMessage } from '@allstak/shared'

export function useMessages(channelId: string | undefined, page?: number) {
  const query = useQuery({
    queryKey: ['chat-messages', channelId, page],
    queryFn: async () => {
      const res = await chatApi.listMessages(channelId!, page)
      const items: ChatMessage[] = res.data?.items ?? res.data ?? []
      // Backend returns DESC order; reverse for chronological display
      return [...items].reverse()
    },
    enabled: !!channelId,
    staleTime: 10_000,
  })

  return {
    messages: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}
