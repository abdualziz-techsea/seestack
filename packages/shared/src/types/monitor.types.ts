export type MonitorStatus = 'up' | 'down' | 'paused' | 'pending'

export interface Monitor {
  id: string
  projectId: string
  name: string
  url: string
  intervalMinutes: number
  isActive: boolean
  createdAt: string
  status: MonitorStatus
  lastResponseTimeMs: number
  uptimePercentage: number
  lastCheckedAt?: string | null
}

export interface MonitorCheck {
  timestamp: string
  status: number        // 0=down, 1=up
  responseTimeMs: number
  statusCode: number
}

export interface MonitorCheckHistory {
  monitorId: string
  uptimePercentage: number
  totalChecks: number
  checks: MonitorCheck[]
}
