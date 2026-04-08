import { useQuery } from '@tanstack/react-query'
import { chatApi } from '@seestack/shared'
import { useAuthStore } from '@/store/auth.store'

export function useChannels() {
  const currentProject = useAuthStore((s) => s.currentProject)
  const orgId = currentProject?.orgId

  const query = useQuery({
    queryKey: ['chat-channels', orgId],
    queryFn: async () => {
      const res = await chatApi.listChannels(orgId!)
      const items = res.data?.items ?? res.data
      // Auto-create defaults if no channels exist
      if (Array.isArray(items) && items.length === 0) {
        await chatApi.createDefaults(orgId!)
        const retry = await chatApi.listChannels(orgId!)
        return retry.data?.items ?? retry.data ?? []
      }
      return items ?? []
    },
    enabled: !!orgId,
    staleTime: 60_000,
  })

  return {
    channels: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}
