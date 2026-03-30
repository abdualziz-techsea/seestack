import { apiClient } from './client'
import type { LogEntry } from '../types/log.types'
import type { PaginatedResponse } from './errors.api'

export interface ListLogsParams {
  projectId: string
  level?: string
  service?: string
  timeRange?: string
  search?: string
  start?: string
  end?: string
  page?: number
  perPage?: number
}

export const logsApi = {
  list: (params: ListLogsParams) =>
    apiClient.get<PaginatedResponse<LogEntry>>('/api/v1/logs', { params }),
}
