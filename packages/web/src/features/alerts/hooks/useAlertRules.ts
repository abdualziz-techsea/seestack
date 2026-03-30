import { useQuery } from '@tanstack/react-query'
import { alertsApi } from '@allstak/shared'
import { useAuthStore } from '@/store/auth.store'

export function useAlertRules() {
  const currentProject = useAuthStore((s) => s.currentProject)

  const query = useQuery({
    queryKey: ['alert-rules', currentProject?.id],
    queryFn: () => alertsApi.list(currentProject!.id).then((r) => r.data?.items ?? r.data),
    enabled: !!currentProject?.id,
  })

  return {
    rules: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}
