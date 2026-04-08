import { useQuery } from '@tanstack/react-query'
import { authApi } from '@seestack/shared'
import { useAuthStore } from '@/store/auth.store'

export function useCurrentUser() {
  const accessToken = useAuthStore((s) => s.accessToken)

  const query = useQuery({
    queryKey: ['current-user'],
    queryFn: () => authApi.me().then((r) => r.data),
    enabled: !!accessToken,
  })

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  }
}
