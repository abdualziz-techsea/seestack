import { useMutation, useQueryClient } from '@tanstack/react-query'
import { monitorsApi, type CreateMonitorRequest } from '@seestack/shared'
import { useAuthStore } from '@/store/auth.store'

export function useCreateMonitor() {
  const queryClient = useQueryClient()
  const currentProject = useAuthStore((s) => s.currentProject)

  const mutation = useMutation({
    mutationFn: (data: Omit<CreateMonitorRequest, 'projectId'>) =>
      monitorsApi.create({ ...data, projectId: currentProject!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors', currentProject?.id] })
    },
  })

  return {
    createMonitor: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  }
}
