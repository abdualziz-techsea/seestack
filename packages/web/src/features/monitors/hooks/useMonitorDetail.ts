import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@seestack/shared'
import { useAuthStore } from '@/store/auth.store'

export interface MonitorCheck {
  timestamp: string
  status: number  // 1=up, 0=down, 2=degraded
  responseTimeMs: number
  statusCode: number | null
  error?: string | null
}

export interface MonitorChecksData {
  uptimePercentage: number
  totalChecks: number
  checks: MonitorCheck[]
}

export interface MonitorDetail {
  id: string
  name: string
  url: string
  intervalMinutes: number
  isActive: boolean
  status?: string
  projectId: string
  createdAt: string
  updatedAt?: string
}

function numericStatusToString(s: number): 'up' | 'down' | 'degraded' {
  if (s === 1) return 'up'
  if (s === 2) return 'degraded'
  return 'down'
}

export { numericStatusToString }

export function useMonitorDetail(monitorId: string) {
  const currentProject = useAuthStore((s) => s.currentProject)

  const query = useQuery({
    queryKey: ['monitor-detail', monitorId, currentProject?.id],
    queryFn: () =>
      apiClient.get(`/api/v1/monitors/${monitorId}`, {
        params: { projectId: currentProject!.id },
      }).then((r) => r.data as MonitorDetail),
    enabled: !!monitorId && !!currentProject?.id,
  })

  return {
    monitor: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useMonitorChecks(monitorId: string, timeRange = '24h') {
  const currentProject = useAuthStore((s) => s.currentProject)

  const query = useQuery({
    queryKey: ['monitor-checks', monitorId, timeRange, currentProject?.id],
    queryFn: () =>
      apiClient.get(`/api/v1/monitors/${monitorId}/checks`, {
        params: { projectId: currentProject!.id, timeRange },
      }).then((r) => r.data as MonitorChecksData),
    enabled: !!monitorId && !!currentProject?.id,
  })

  return {
    checks: query.data?.checks ?? [],
    uptimePercentage: query.data?.uptimePercentage ?? 0,
    totalChecks: query.data?.totalChecks ?? 0,
    avgResponseTimeMs: query.data?.checks?.length
      ? Math.round(query.data.checks.reduce((s, c) => s + (c.responseTimeMs ?? 0), 0) / query.data.checks.length)
      : 0,
    isLoading: query.isLoading,
    error: query.error,
  }
}

export function usePauseResumeMonitor() {
  const queryClient = useQueryClient()
  const currentProject = useAuthStore((s) => s.currentProject)

  return useMutation({
    mutationFn: ({ id, name, url, intervalMinutes, isActive }: {
      id: string; name: string; url: string; intervalMinutes: number; isActive: boolean
    }) =>
      apiClient.put(`/api/v1/monitors/${id}`, {
        projectId: currentProject!.id,
        name,
        url,
        intervalMinutes,
        isActive,
      }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['monitor-detail', vars.id] })
      queryClient.invalidateQueries({ queryKey: ['monitors'] })
    },
  })
}

export function useDeleteMonitorById() {
  const queryClient = useQueryClient()
  const currentProject = useAuthStore((s) => s.currentProject)

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/api/v1/monitors/${id}`, {
        params: { projectId: currentProject!.id },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] })
    },
  })
}
