import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@seestack/shared'
import { useAuthStore } from '@/store/auth.store'

export function useOverviewData() {
  const currentProject = useAuthStore((s) => s.currentProject)
  const projectId = currentProject?.id

  // Fetch errors for total count (perPage=1 to get pagination.total)
  const errorsQuery = useQuery({
    queryKey: ['overview-errors', projectId],
    queryFn: () =>
      apiClient.get('/api/v1/errors', {
        params: { projectId, page: 1, perPage: 1 },
      }).then((r) => r.data),
    enabled: !!projectId,
  })

  // Fetch unresolved errors count
  const unresolvedQuery = useQuery({
    queryKey: ['overview-errors-unresolved', projectId],
    queryFn: () =>
      apiClient.get('/api/v1/errors', {
        params: { projectId, page: 1, perPage: 1, status: 'unresolved' },
      }).then((r) => r.data),
    enabled: !!projectId,
  })

  // Fetch monitors for stats
  const monitorsQuery = useQuery({
    queryKey: ['overview-monitors', projectId],
    queryFn: () =>
      apiClient.get('/api/v1/monitors', {
        params: { projectId },
      }).then((r) => r.data),
    enabled: !!projectId,
  })

  // apiClient interceptor unwraps {success, data} → data is already the inner payload
  const totalErrors = errorsQuery.data?.pagination?.total ?? 0
  const newErrors = unresolvedQuery.data?.pagination?.total ?? 0
  const monitorsData = monitorsQuery.data
  const monitors = Array.isArray(monitorsData) ? monitorsData : monitorsData?.items ?? []
  const monitorsUp = monitors.filter((m: any) => m.status === 'up').length

  const stats = [
    { labelKey: 'overview.totalErrors', value: totalErrors },
    { labelKey: 'overview.newErrors', value: newErrors },
    { labelKey: 'overview.monitorsUp', value: monitorsUp },
    { labelKey: 'overview.sshSessions', value: 0 },
  ]

  return {
    data: { stats },
    isLoading: errorsQuery.isLoading || unresolvedQuery.isLoading || monitorsQuery.isLoading,
    error: errorsQuery.error || unresolvedQuery.error || monitorsQuery.error,
    refetch: () => { errorsQuery.refetch(); unresolvedQuery.refetch(); monitorsQuery.refetch() },
  }
}
