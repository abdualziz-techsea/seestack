import { apiClient } from './client'
import type { AlertRule } from '../types/alert.types'

export interface CreateAlertRuleRequest {
  projectId: string
  name: string
  triggerType: string
  triggerConfig: Record<string, unknown>
  severityFilter: string
  quietHoursEnabled: boolean
  quietStart: string
  quietEnd: string
  channels: { type: string; webhookUrl?: string; to?: string[] }[]
}

export const alertsApi = {
  list: (projectId: string) =>
    apiClient.get<AlertRule[]>('/api/v1/alert-rules', { params: { projectId } }),

  create: (data: CreateAlertRuleRequest) =>
    apiClient.post<AlertRule>('/api/v1/alert-rules', data),

  update: (id: string, data: Partial<CreateAlertRuleRequest>) =>
    apiClient.put<AlertRule>(`/api/v1/alert-rules/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/api/v1/alert-rules/${id}`),

  toggle: (id: string, isEnabled: boolean) =>
    apiClient.patch(`/api/v1/alert-rules/${id}/toggle`, { isEnabled }),
}
