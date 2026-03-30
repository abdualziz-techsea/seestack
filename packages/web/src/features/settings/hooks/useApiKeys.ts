import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@allstak/shared'
import { useAuthStore } from '@/store/auth.store'

export function useApiKeys() {
  const currentProject = useAuthStore((s) => s.currentProject)

  const query = useQuery({
    queryKey: ['api-keys', currentProject?.id],
    queryFn: () =>
      apiClient
        .get(`/api/v1/projects/${currentProject!.id}/api-keys`)
        .then((r) => r.data?.items ?? r.data ?? []),
    enabled: !!currentProject?.id,
  })

  return {
    keys: Array.isArray(query.data) ? query.data : [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useCreateApiKey() {
  const currentProject = useAuthStore((s) => s.currentProject)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { name: string }) =>
      apiClient
        .post(`/api/v1/projects/${currentProject!.id}/api-keys`, data)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
    },
  })
}

export function useRevokeApiKey() {
  const currentProject = useAuthStore((s) => s.currentProject)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (keyId: string) =>
      apiClient.delete(`/api/v1/projects/${currentProject!.id}/api-keys/${keyId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
    },
  })
}
