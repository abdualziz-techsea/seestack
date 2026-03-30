import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@allstak/shared'
import { useAuthStore } from '@/store/auth.store'

export interface FlagAuditEvent {
  id: string
  flagKey: string
  action: string
  userId: string | null
  userEmail: string | null
  details: string | null
  createdAt: string
}

export function useFlagDetail(flagKey: string) {
  const currentProject = useAuthStore((s) => s.currentProject)

  const query = useQuery({
    queryKey: ['flag-detail', flagKey, currentProject?.id],
    queryFn: () =>
      apiClient.get(`/api/v1/flags/${flagKey}`, {
        params: { projectId: currentProject!.id },
      }).then((r) => r.data),
    enabled: !!flagKey && !!currentProject?.id,
  })

  return {
    flag: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useFlagAudit(flagKey: string) {
  const currentProject = useAuthStore((s) => s.currentProject)

  const query = useQuery({
    queryKey: ['flag-audit', flagKey, currentProject?.id],
    queryFn: () =>
      apiClient.get(`/api/v1/flags/${flagKey}/audit`, {
        params: { projectId: currentProject!.id },
      }).then((r) => {
        const data = r.data
        return (Array.isArray(data) ? data : data?.items ?? []) as FlagAuditEvent[]
      }),
    enabled: !!flagKey && !!currentProject?.id,
    retry: false,
  })

  return {
    events: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  }
}
