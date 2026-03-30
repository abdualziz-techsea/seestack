import { apiClient } from './client'
import type { ErrorGroup, ErrorDetail, ErrorStatus } from '../types/error.types'

export interface ListErrorsParams {
  projectId: string
  status?: string
  environment?: string
  page?: number
  perPage?: number
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: { page: number; perPage: number; total: number }
}

export const errorsApi = {
  list: (params: ListErrorsParams) =>
    apiClient.get<PaginatedResponse<ErrorGroup>>('/api/v1/errors', { params }),

  getByFingerprint: (fingerprint: string, projectId: string) =>
    apiClient.get<ErrorDetail>(`/api/v1/errors/${fingerprint}`, {
      params: { projectId },
    }),

  updateStatus: (fingerprint: string, projectId: string, status: ErrorStatus) =>
    apiClient.patch(`/api/v1/errors/${fingerprint}/status`, { projectId, status }),
}
