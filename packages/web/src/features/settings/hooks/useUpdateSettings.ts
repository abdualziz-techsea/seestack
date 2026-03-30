import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@allstak/shared'
import { useAuthStore } from '@/store/auth.store'

export function useUpdateSettings() {
  const org = useAuthStore((s) => s.org)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiClient.put(`/api/v1/organizations/${org!.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-settings'] })
    },
  })

  return {
    update: mutation.mutateAsync,
    isLoading: mutation.isPending,
  }
}
