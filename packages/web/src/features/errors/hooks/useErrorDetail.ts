import { useQuery } from '@tanstack/react-query'
import { errorsApi } from '@allstak/shared'
import { useAuthStore } from '@/store/auth.store'

export function useErrorDetail(fingerprint: string | undefined) {
  const currentProject = useAuthStore((s) => s.currentProject)

  const query = useQuery({
    queryKey: ['error-detail', fingerprint, currentProject?.id],
    queryFn: () =>
      errorsApi.getByFingerprint(fingerprint!, currentProject!.id).then((r) => r.data),
    enabled: !!fingerprint && !!currentProject?.id,
  })

  return {
    error: query.data ?? null,
    isLoading: query.isLoading,
    fetchError: query.error,
  }
}
