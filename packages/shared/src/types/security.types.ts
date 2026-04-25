export interface SecurityScanHttpInfo {
  url?: string
  statusCode?: number
  responseTimeMs?: number
  server?: string
  contentType?: string
}

export interface SecurityScan {
  id: string
  projectId?: string | null
  target: string
  resolvedHost?: string | null
  scannedPorts: number[]
  openPorts: number[]
  closedPorts: number[]
  detectedServices?: Record<string, string>
  httpInfo?: SecurityScanHttpInfo | Record<string, unknown>
  securityHeaders?: Record<string, boolean>
  riskScore?: number
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | string
  summary?: string | null
  status: 'pending' | 'completed' | 'failed' | string
  errorMessage?: string | null
  scanType: string
  createdAt: string
  completedAt?: string | null
}

export interface SecurityScanListResponse {
  items: SecurityScan[]
  scanType: string
  scannedPorts: number[]
  checkedHeaders?: string[]
  pagination: { page: number; perPage: number; total: number }
}
