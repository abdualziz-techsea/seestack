import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@allstak/shared'
import { useAuthStore } from '@/store/auth.store'

export interface CronMonitor {
  id: string
  name: string
  slug: string
  schedule: string
  gracePeriodMin: number
  isActive: boolean
  currentStatus: string
  lastPingAt: string | null
  nextExpectedAt: string | null
  lastDurationMs: number
  lastMessage: string | null
  createdAt: string
}

export function useCronMonitors() {
  const currentProject = useAuthStore((s) => s.currentProject)

  const query = useQuery({
    queryKey: ['cron-monitors', currentProject?.id],
    queryFn: () =>
      apiClient.get('/api/v1/cron-monitors', {
        params: { projectId: currentProject!.id },
      }).then((r) => r.data),
    enabled: !!currentProject?.id,
  })

  return {
    monitors: query.data?.items ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useCreateCronMonitor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { projectId: string; name: string; slug: string; schedule: string; gracePeriodMin: number }) =>
      apiClient.post('/api/v1/cron-monitors', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cron-monitors'] })
    },
  })
}

export function useDeleteCronMonitor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, projectId }: { id: string; projectId: string }) =>
      apiClient.delete(`/api/v1/cron-monitors/${id}`, { params: { projectId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cron-monitors'] })
    },
  })
}
