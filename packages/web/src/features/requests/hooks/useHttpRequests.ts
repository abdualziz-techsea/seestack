import { useQuery } from '@tanstack/react-query'
import { requestsApi } from '@allstak/shared'
import { useAuthStore } from '@/store/auth.store'

interface UseHttpRequestsParams {
  direction?: string
  method?: string
  statusGroup?: string
  path?: string
  page?: number
  perPage?: number
}

export function useHttpRequests(params?: UseHttpRequestsParams) {
  const currentProject = useAuthStore((s) => s.currentProject)
  const page = params?.page ?? 1
  const perPage = params?.perPage ?? 50

  const query = useQuery({
    queryKey: ['http-requests', currentProject?.id, params?.direction, params?.method, params?.statusGroup, params?.path, page, perPage],
    queryFn: () =>
      requestsApi.list({
        projectId: currentProject!.id,
        direction: params?.direction,
        method: params?.method,
        statusGroup: params?.statusGroup,
        path: params?.path,
        page,
        perPage,
      }).then((r) => r.data),
    enabled: !!currentProject?.id,
  })

  return {
    requests: query.data?.items ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}
