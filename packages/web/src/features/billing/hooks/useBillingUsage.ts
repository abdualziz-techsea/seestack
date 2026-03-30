import { useQuery } from '@tanstack/react-query'
import { billingApi } from '@allstak/shared'
import { useAuthStore } from '@/store/auth.store'

export function useBillingUsage() {
  const org = useAuthStore((s) => s.org)

  const query = useQuery({
    queryKey: ['billing-usage', org?.id],
    queryFn: () => billingApi.getUsage(org!.id).then((r) => r.data),
    enabled: !!org?.id,
  })

  return {
    usage: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  }
}
