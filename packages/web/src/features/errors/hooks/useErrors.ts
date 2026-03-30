import { useQuery } from '@tanstack/react-query'
import { errorsApi } from '@allstak/shared'
import { useAuthStore } from '@/store/auth.store'

interface UseErrorsParams {
  status?: string
  environment?: string
  page?: number
  perPage?: number
}

export function useErrors(params?: UseErrorsParams) {
  const currentProject = useAuthStore((s) => s.currentProject)
  const status = params?.status
  const environment = params?.environment
  const page = params?.page ?? 1
  const perPage = params?.perPage ?? 20

  const query = useQuery({
    queryKey: ['errors', currentProject?.id, status, environment, page, perPage],
    queryFn: () =>
      errorsApi.list({ projectId: currentProject!.id, status, environment, page, perPage }).then((r) => r.data),
    enabled: !!currentProject?.id,
    staleTime: 30_000,
  })

  return {
    errors: query.data?.items ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}
