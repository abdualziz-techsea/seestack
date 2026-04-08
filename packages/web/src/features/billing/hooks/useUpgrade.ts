import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { billingApi } from '@seestack/shared'

/**
 * Fetches the authoritative plan price from the backend.
 * This ensures the amount passed to Moyasar.init() cannot be tampered with client-side.
 */
export function usePlanPrice(plan: string | null) {
  const query = useQuery({
    queryKey: ['plan-price', plan],
    queryFn: () => billingApi.getPlanPrice(plan!).then((r) => r.data),
    enabled: !!plan && plan !== 'free',
    staleTime: 10 * 60 * 1000, // 10 min — prices are stable
  })

  return {
    priceData: query.data ?? null,
    isLoading: query.isLoading,
  }
}

/** Tracks which plan the user is trying to upgrade to (triggers modal). */
export function useUpgradePlan() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  return { selectedPlan, setSelectedPlan }
}
