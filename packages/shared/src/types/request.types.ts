export type HttpDirection = 'inbound' | 'outbound'
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'
export type StatusGroup = '2xx' | '3xx' | '4xx' | '5xx'

export interface HttpRequestEntry {
  id: string
  traceId: string | null
  direction: HttpDirection
  method: string
  host: string
  path: string
  statusCode: number
  durationMs: number
  isSlow: boolean
  userId: string | null
  errorFingerprint: string | null
  timestamp: string
}

export interface HttpRequestStats {
  totalRequests: number
  errorRate: number
  slowRate: number
  p50: number
  p95: number
  p99: number
  inboundCount: number
  outboundCount: number
}

export interface TopHostEntry {
  host: string
  requestCount: number
  failureCount: number
  avgDurationMs: number
}
