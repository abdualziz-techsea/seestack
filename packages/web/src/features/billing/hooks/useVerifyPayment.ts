import { useMutation, useQueryClient } from '@tanstack/react-query'
import { billingApi } from '@allstak/shared'
import { useAuthStore } from '@/store/auth.store'

export function useVerifyPayment() {
  const org = useAuthStore((s) => s.org)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ paymentId, plan }: { paymentId: string; plan: string }) =>
      billingApi.verifyPayment(org!.id, paymentId, plan).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-subscription'] })
      queryClient.invalidateQueries({ queryKey: ['billing-invoices'] })
    },
  })
}
