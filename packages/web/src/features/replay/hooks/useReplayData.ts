import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@allstak/shared'

export function useReplayData(sessionId: string | undefined) {
  const query = useQuery({
    queryKey: ['replay', sessionId],
    queryFn: () =>
      apiClient.get(`/api/v1/replay/${sessionId}`).then((r) => r.data),
    enabled: !!sessionId,
  })

  return {
    events: query.data?.events ?? [],
    duration: query.data?.duration ?? 0,
    isLoading: query.isLoading,
    error: query.error,
  }
}
