import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@seestack/shared'
import { useAuthStore } from '@/store/auth.store'

export interface FeatureFlag {
  id: string
  key: string
  name: string
  description: string
  type: string
  defaultValue: string
  rolloutPercent: number
  rules: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export function useFeatureFlags() {
  const currentProject = useAuthStore((s) => s.currentProject)

  const query = useQuery({
    queryKey: ['feature-flags', currentProject?.id],
    queryFn: () =>
      apiClient.get('/api/v1/flags', {
        params: { projectId: currentProject!.id },
      }).then((r) => r.data),
    enabled: !!currentProject?.id,
  })

  const raw = query.data?.items ?? query.data ?? []
  const items = Array.isArray(raw)
    ? raw.map((f: any) => ({ ...f, active: f.active ?? f.isActive ?? false }))
    : []

  return {
    flags: items,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useCreateFlag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { projectId: string; key: string; name: string; description: string; type: string; defaultValue: string; rolloutPercent: number; rules?: unknown }) =>
      apiClient.post('/api/v1/flags', { ...data, rules: data.rules ?? null }, { params: { projectId: data.projectId } }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] })
    },
  })
}

export function useToggleFlag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ key, projectId }: { key: string; projectId: string }) =>
      apiClient.patch(`/api/v1/flags/${key}/toggle`, null, { params: { projectId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] })
    },
  })
}

export function useDeleteFlag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ key, projectId }: { key: string; projectId: string }) =>
      apiClient.delete(`/api/v1/flags/${key}`, { params: { projectId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] })
    },
  })
}
