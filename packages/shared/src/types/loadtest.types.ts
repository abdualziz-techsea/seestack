export interface LoadTest {
  id: string
  projectId: string
  monitorId?: string | null
  targetUrl: string
  requestedCount: number
  concurrency: number
  status: 'pending' | 'completed' | 'failed' | string
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  avgResponseTimeMs: number
  minResponseTimeMs: number
  maxResponseTimeMs: number
  p95ResponseTimeMs: number
  statusCodeDistribution: Record<string, number>
  errorMessage?: string | null
  testType: string
  createdAt: string
  completedAt?: string | null
}

export interface LoadTestLimits {
  maxRequests: number
  maxConcurrency: number
  timeoutSeconds: number
  cooldownSeconds: number
}

export interface LoadTestListResponse {
  items: LoadTest[]
  limits: LoadTestLimits
  pagination: { page: number; perPage: number; total: number }
}
