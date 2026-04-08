import { useQuery } from '@tanstack/react-query'
import { sshApi } from '@seestack/shared'
import { useAuthStore } from '@/store/auth.store'

export function useSshServers() {
  const currentProject = useAuthStore((s) => s.currentProject)

  const query = useQuery({
    queryKey: ['ssh-servers', currentProject?.id],
    queryFn: () =>
      sshApi.listServers(currentProject!.id).then((r) => r.data),
    enabled: !!currentProject?.id,
    staleTime: 30_000,
  })

  return {
    servers: query.data?.items ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}
