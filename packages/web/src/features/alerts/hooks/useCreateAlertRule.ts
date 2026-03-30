import { useMutation, useQueryClient } from '@tanstack/react-query'
import { alertsApi, type CreateAlertRuleRequest } from '@allstak/shared'

export function useCreateAlertRule() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: CreateAlertRuleRequest) => alertsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] })
    },
  })

  return {
    createRule: mutation.mutateAsync,
    isLoading: mutation.isPending,
  }
}
