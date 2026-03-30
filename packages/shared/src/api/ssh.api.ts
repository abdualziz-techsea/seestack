import { apiClient } from './client'
import type { SshServer, SshAuditEntry } from '../types/ssh.types'
import type { PaginatedResponse } from './errors.api'

export interface CreateSshServerRequest {
  projectId: string
  name: string
  host: string
  port: number
  username: string
  privateKey: string
}

export interface UpdateSshServerRequest {
  projectId: string
  name: string
  host: string
  port: number
  username: string
  privateKey: string
}

export const sshApi = {
  listServers: (projectId: string) =>
    apiClient.get<PaginatedResponse<SshServer>>('/api/v1/ssh/servers', { params: { projectId } }),

  getById: (id: string, projectId: string) =>
    apiClient.get<SshServer>(`/api/v1/ssh/servers/${id}`, { params: { projectId } }),

  create: (data: CreateSshServerRequest) =>
    apiClient.post<SshServer>('/api/v1/ssh/servers', data),

  update: (id: string, data: UpdateSshServerRequest) =>
    apiClient.put<SshServer>(`/api/v1/ssh/servers/${id}`, data),

  delete: (id: string, projectId: string) =>
    apiClient.delete(`/api/v1/ssh/servers/${id}`, { params: { projectId } }),

  getAuditLog: (serverId: string, projectId: string, timeRange?: string) =>
    apiClient.get<PaginatedResponse<SshAuditEntry>>(`/api/v1/ssh/servers/${serverId}/audit`, {
      params: { projectId, timeRange },
    }),
}
