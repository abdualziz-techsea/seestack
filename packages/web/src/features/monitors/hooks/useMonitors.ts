import { useQuery } from '@tanstack/react-query'
import { monitorsApi } from '@seestack/shared'
import { useAuthStore } from '@/store/auth.store'

export function useMonitors() {
  const currentProject = useAuthStore((s) => s.currentProject)

  const query = useQuery({
    queryKey: ['monitors', currentProject?.id],
    queryFn: () =>
      monitorsApi.list(currentProject!.id).then((r) => r.data),
    enabled: !!currentProject?.id,
    staleTime: 30_000,
  })

  return {
    monitors: query.data?.items ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}
