import { apiClient } from './client'
import type { SecurityScan, SecurityScanListResponse } from '../types/security.types'

export const securityApi = {
  create: (target: string, projectId?: string | null) =>
    apiClient.post<SecurityScan>('/api/v1/security-scans', { target, projectId: projectId ?? null }),

  list: (page = 1, perPage = 20) =>
    apiClient.get<SecurityScanListResponse>('/api/v1/security-scans', {
      params: { page, perPage },
    }),

  getById: (id: string) =>
    apiClient.get<SecurityScan>(`/api/v1/security-scans/${id}`),
}
