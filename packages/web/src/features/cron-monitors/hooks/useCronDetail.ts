import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@seestack/shared'
import { useAuthStore } from '@/store/auth.store'

export interface CronExecution {
  id: string
  cronMonitorId: string
  status: 'ok' | 'missed' | 'failed'
  durationMs: number | null
  message: string | null
  executedAt: string
}

export function useCronDetail(cronId: string) {
  const currentProject = useAuthStore((s) => s.currentProject)

  const query = useQuery({
    queryKey: ['cron-detail', cronId, currentProject?.id],
    queryFn: () =>
      apiClient.get(`/api/v1/cron-monitors/${cronId}`, {
        params: { projectId: currentProject!.id },
      }).then((r) => r.data),
    enabled: !!cronId && !!currentProject?.id,
  })

  return {
    cron: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useCronHistory(cronId: string) {
  const currentProject = useAuthStore((s) => s.currentProject)

  const query = useQuery({
    queryKey: ['cron-history', cronId, currentProject?.id],
    queryFn: () =>
      apiClient.get(`/api/v1/cron-monitors/${cronId}/history`, {
        params: { projectId: currentProject!.id },
      }).then((r) => {
        const data = r.data
        return (Array.isArray(data) ? data : data?.items ?? []) as CronExecution[]
      }),
    enabled: !!cronId && !!currentProject?.id,
    retry: false,
  })

  return {
    history: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  }
}

export function useToggleCronMonitor() {
  const queryClient = useQueryClient()
  const currentProject = useAuthStore((s) => s.currentProject)

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient.patch(`/api/v1/cron-monitors/${id}`, { isActive }, {
        params: { projectId: currentProject!.id },
      }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['cron-detail', vars.id] })
      queryClient.invalidateQueries({ queryKey: ['cron-monitors'] })
    },
  })
}
