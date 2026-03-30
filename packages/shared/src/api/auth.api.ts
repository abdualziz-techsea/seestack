import { apiClient } from './client'
import type { User, Project } from '../types/auth.types'

export const authApi = {
  me: () =>
    apiClient.get<User>('/api/v1/auth/me'),

  listProjects: () =>
    apiClient.get<Project[]>('/api/v1/projects'),

  switchProject: (projectId: string) =>
    apiClient.post('/api/v1/auth/switch-project', { projectId }),
}
