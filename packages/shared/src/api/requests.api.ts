import { apiClient } from './client'
import type { HttpRequestEntry, HttpRequestStats, TopHostEntry } from '../types/request.types'
import type { PaginatedResponse } from './errors.api'

export interface ListHttpRequestsParams {
  projectId: string
  direction?: string
  method?: string
  statusGroup?: string
  path?: string
  from?: string
  to?: string
  page?: number
  perPage?: number
}

export const requestsApi = {
  list: (params: ListHttpRequestsParams) =>
    apiClient.get<PaginatedResponse<HttpRequestEntry>>('/api/v1/http-requests', { params }),

  stats: (projectId: string, params?: { direction?: string; from?: string; to?: string }) =>
    apiClient.get<HttpRequestStats>('/api/v1/http-requests/stats', {
      params: { projectId, ...params },
    }),

  topHosts: (projectId: string, params?: { from?: string; to?: string }) =>
    apiClient.get<TopHostEntry[]>('/api/v1/http-requests/top-hosts', {
      params: { projectId, ...params },
    }),

  byTrace: (traceId: string, projectId: string) =>
    apiClient.get<HttpRequestEntry[]>('/api/v1/http-requests/by-trace', {
      params: { traceId, projectId },
    }),
}
