import { useQuery } from '@tanstack/react-query'
import { chatApi } from '@allstak/shared'
import type { ChatMessage } from '@allstak/shared'

export function usePinnedMessages(channelId: string | undefined) {
  const query = useQuery({
    queryKey: ['chat-pinned', channelId],
    queryFn: () =>
      chatApi.getPinnedMessages(channelId!).then((r) => {
        const d = r.data
        return (Array.isArray(d) ? d : (d as any)?.items ?? []) as ChatMessage[]
      }),
    enabled: !!channelId,
    staleTime: 30_000,
    retry: false,
  })

  return {
    pinnedMessages: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  }
}
