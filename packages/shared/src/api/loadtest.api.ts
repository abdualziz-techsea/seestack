import { apiClient } from './client'
import type { LoadTest, LoadTestListResponse } from '../types/loadtest.types'

export interface CreateLoadTestParams {
  projectId: string
  monitorId: string
  requests: number
  concurrency: number
}

export const loadTestApi = {
  create: (params: CreateLoadTestParams) =>
    apiClient.post<LoadTest>('/api/v1/load-tests', params, { timeout: 60_000 }),

  list: (projectId: string, page = 1, perPage = 20) =>
    apiClient.get<LoadTestListResponse>('/api/v1/load-tests', {
      params: { projectId, page, perPage },
    }),

  getById: (id: string, projectId: string) =>
    apiClient.get<LoadTest>(`/api/v1/load-tests/${id}`, { params: { projectId } }),
}
