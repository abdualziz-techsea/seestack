import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@allstak/shared'
import { useAuthStore } from '@/store/auth.store'

export interface Project {
  id: string
  name: string
  slug: string
  platform: string
  description?: string
  status: 'active' | 'archived'
  serversCount: number
  errorsCount: number
  createdAt: string
}

export function useProjects() {
  const org = useAuthStore((s) => s.org)

  const query = useQuery({
    queryKey: ['projects', org?.id],
    queryFn: () =>
      apiClient.get('/api/v1/projects', { params: { orgId: org?.id } })
        .then((r) => {
          const items: any[] = (r.data as any)?.items ?? r.data ?? []
          return items.map((p) => ({
            ...p,
            status: p.status ?? 'active',
            serversCount: p.serversCount ?? 0,
            errorsCount: p.errorsCount ?? 0,
          })) as Project[]
        }),
    enabled: !!org?.id,
  })

  return {
    projects: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}
