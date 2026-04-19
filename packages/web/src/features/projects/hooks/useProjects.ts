import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@seestack/shared'
import type { Project } from '@seestack/shared'
import { useAuthStore } from '@/store/auth.store'

async function fetchProjects(): Promise<Project[]> {
  const res: any = await apiClient.get('/api/v1/projects')
  // apiClient unwraps { success, data, meta } -> data
  return Array.isArray(res) ? res : res?.data ?? []
}

export function useProjects() {
  const setProjects = useAuthStore((s) => s.setProjects)
  const q = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const list = await fetchProjects()
      setProjects(list)
      return list
    },
  })
  return { projects: q.data ?? [], isLoading: q.isLoading, error: q.error as Error | null, refetch: q.refetch }
}

export function useCreateProject() {
  const qc = useQueryClient()
  const setCurrentProject = useAuthStore((s) => s.setCurrentProject)
  const currentProject = useAuthStore((s) => s.currentProject)
  const m = useMutation({
    mutationFn: async ({ name, platform }: { name: string; platform?: string }) => {
      const res: any = await apiClient.post('/api/v1/projects', { name, platform })
      return (res?.id ? res : res?.data ?? res) as Project
    },
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      if (!currentProject) setCurrentProject(created)
    },
  })
  return { create: m.mutateAsync, isLoading: m.isPending, error: m.error as Error | null }
}
