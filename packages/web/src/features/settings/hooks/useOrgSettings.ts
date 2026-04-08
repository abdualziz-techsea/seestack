import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@seestack/shared'
import { useAuthStore } from '@/store/auth.store'

export function useOrgSettings() {
  const org = useAuthStore((s) => s.org)

  const query = useQuery({
    queryKey: ['org-settings', org?.id],
    queryFn: () =>
      apiClient.get(`/api/v1/organizations/${org!.id}`).then((r) => r.data),
    enabled: !!org?.id,
  })

  return {
    settings: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  }
}
