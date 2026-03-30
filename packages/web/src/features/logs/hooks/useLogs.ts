import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { logsApi, type ListLogsParams } from '@allstak/shared'
import { useAuthStore } from '@/store/auth.store'

interface UseLogsParams {
  level?: string
  service?: string
  timeRange?: string
  search?: string
  page?: number
  perPage?: number
}

export function useLogs(params?: UseLogsParams) {
  const currentProject = useAuthStore((s) => s.currentProject)

  // Build a stable query key from individual primitives, not an object reference
  const level = params?.level
  const service = params?.service
  const timeRange = params?.timeRange
  const search = params?.search
  const page = params?.page ?? 1
  const perPage = params?.perPage ?? 50

  const query = useQuery({
    queryKey: ['logs', currentProject?.id, level, service, timeRange, search, page, perPage],
    queryFn: () => {
      const apiParams: ListLogsParams = {
        projectId: currentProject!.id,
        page,
        perPage,
      }
      if (level) apiParams.level = level
      if (service) apiParams.service = service
      if (timeRange) apiParams.timeRange = timeRange
      if (search) apiParams.search = search
      return logsApi.list(apiParams).then((r) => r.data)
    },
    enabled: !!currentProject?.id,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  })

  return {
    logs: query.data?.items ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  }
}
