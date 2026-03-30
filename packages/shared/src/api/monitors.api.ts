import { apiClient } from './client'
import type { Monitor, MonitorCheckHistory } from '../types/monitor.types'
import type { PaginatedResponse } from './errors.api'

export interface CreateMonitorRequest {
  projectId: string
  name: string
  url: string
  intervalMinutes: number
}

export interface UpdateMonitorRequest {
  projectId: string
  name: string
  url: string
  intervalMinutes: number
  isActive: boolean
}

export const monitorsApi = {
  list: (projectId: string) =>
    apiClient.get<PaginatedResponse<Monitor>>('/api/v1/monitors', { params: { projectId } }),

  getById: (id: string, projectId: string) =>
    apiClient.get<Monitor>(`/api/v1/monitors/${id}`, { params: { projectId } }),

  create: (data: CreateMonitorRequest) =>
    apiClient.post<Monitor>('/api/v1/monitors', data),

  update: (id: string, data: UpdateMonitorRequest) =>
    apiClient.put<Monitor>(`/api/v1/monitors/${id}`, data),

  delete: (id: string, projectId: string) =>
    apiClient.delete(`/api/v1/monitors/${id}`, { params: { projectId } }),

  checks: (monitorId: string, projectId: string, timeRange?: string) =>
    apiClient.get<MonitorCheckHistory>(`/api/v1/monitors/${monitorId}/checks`, {
      params: { projectId, timeRange },
    }),
}
