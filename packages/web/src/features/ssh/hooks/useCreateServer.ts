import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sshApi, type CreateSshServerRequest } from '@allstak/shared'

export function useCreateServer() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: CreateSshServerRequest) => sshApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ssh-servers'] })
    },
  })

  return {
    createServer: mutation.mutateAsync,
    isLoading: mutation.isPending,
  }
}
