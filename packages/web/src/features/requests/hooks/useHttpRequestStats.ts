import { useQuery } from '@tanstack/react-query'
import { requestsApi } from '@seestack/shared'
import { useAuthStore } from '@/store/auth.store'

export function useHttpRequestStats() {
  const currentProject = useAuthStore((s) => s.currentProject)

  const query = useQuery({
    queryKey: ['http-request-stats', currentProject?.id],
    queryFn: () =>
      requestsApi.stats(currentProject!.id).then((r) => r.data),
    enabled: !!currentProject?.id,
  })

  return {
    stats: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  }
}
