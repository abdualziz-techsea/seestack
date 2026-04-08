import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { billingApi } from '@seestack/shared'
import { useAuthStore } from '@/store/auth.store'

export function useInvoices() {
  const org = useAuthStore((s) => s.org)

  const query = useQuery({
    queryKey: ['billing-invoices', org?.id],
    queryFn: () => billingApi.listInvoices(org!.id).then((r) => r.data),
    enabled: !!org?.id,
  })

  return {
    invoices: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useCancelInvoice() {
  const org = useAuthStore((s) => s.org)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (moyasarId: string) => billingApi.cancelInvoice(org!.id, moyasarId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-invoices'] })
    },
  })
}
