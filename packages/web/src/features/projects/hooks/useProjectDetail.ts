import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@allstak/shared'
import { useAuthStore } from '@/store/auth.store'

export function useProjectDetail(projectId: string) {
  const org = useAuthStore((s) => s.org)

  const query = useQuery({
    queryKey: ['project-detail', projectId, org?.id],
    queryFn: () =>
      apiClient.get(`/api/v1/projects/${projectId}`, {
        params: { orgId: org!.id },
      }).then((r) => r.data),
    enabled: !!projectId && !!org?.id,
  })

  return {
    project: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient()
  const org = useAuthStore((s) => s.org)

  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      apiClient.put(`/api/v1/projects/${projectId}`, { ...data, orgId: org!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-detail', projectId] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}
