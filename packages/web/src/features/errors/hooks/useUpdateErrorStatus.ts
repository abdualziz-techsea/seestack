import { useMutation, useQueryClient } from '@tanstack/react-query'
import { errorsApi, type ErrorStatus } from '@allstak/shared'
import { useAuthStore } from '@/store/auth.store'

export function useUpdateErrorStatus() {
  const currentProject = useAuthStore((s) => s.currentProject)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ fingerprint, status }: { fingerprint: string; status: ErrorStatus }) =>
      errorsApi.updateStatus(fingerprint, currentProject!.id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['errors'] })
      queryClient.invalidateQueries({ queryKey: ['error-detail'] })
    },
  })

  return {
    updateStatus: mutation.mutateAsync,
    isLoading: mutation.isPending,
  }
}
