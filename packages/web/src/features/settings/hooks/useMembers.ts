import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@allstak/shared'
import { useAuthStore } from '@/store/auth.store'

export function useMembers() {
  const org = useAuthStore((s) => s.org)

  const query = useQuery({
    queryKey: ['members', org?.id],
    queryFn: () =>
      apiClient.get('/api/v1/settings/members', {
        params: { orgId: org!.id },
      }).then((r) => r.data?.items ?? r.data),
    enabled: !!org?.id,
  })

  return {
    members: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}
