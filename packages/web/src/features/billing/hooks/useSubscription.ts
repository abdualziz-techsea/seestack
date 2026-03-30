import { useQuery } from '@tanstack/react-query'
import { billingApi } from '@allstak/shared'
import { useAuthStore } from '@/store/auth.store'

export function useSubscription() {
  const org = useAuthStore((s) => s.org)

  const query = useQuery({
    queryKey: ['billing-subscription', org?.id],
    queryFn: () => billingApi.getSubscription(org!.id).then((r) => r.data),
    enabled: !!org?.id,
  })

  return {
    subscription: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  }
}
