export type ErrorStatus = 'unresolved' | 'resolved' | 'ignored'
export type ErrorLevel = 'debug' | 'info' | 'warning' | 'error' | 'fatal'
export type Environment = 'production' | 'staging' | 'development'

export interface StackFrame {
  file: string
  line: number
  function: string
  isAppFrame: boolean
}

export interface UserContext {
  id?: string
  email?: string
  ip?: string
}

export interface ErrorGroup {
  id: string
  fingerprint: string
  exceptionClass: string
  title: string
  status: ErrorStatus
  level?: ErrorLevel | null
  environment?: Environment | null
  occurrences: number
  firstSeen: string
  lastSeen: string
  assignedTo?: string
  projectId?: string
}

export interface RecentOccurrence {
  id: string
  timestamp: string
  environment?: string | null
  level?: string | null
}

export interface ErrorInsightsTimelinePoint {
  bucket: string
  count: number
}

export interface ErrorInsightsFingerprint {
  exceptionClass: string
  normalizedMessage: string
  topFrame: string
  formula: string
}

export interface ErrorInsights {
  impactLevel: 'LOW' | 'MEDIUM' | 'HIGH' | string
  recentActivity: 'Active recently' | 'No recent activity' | string
  activeRecently: boolean
  totalOccurrences: number
  firstSeen: string
  lastSeen: string
  patterns: string[]
  fingerprint: ErrorInsightsFingerprint
  timeline: ErrorInsightsTimelinePoint[]
}

export interface ErrorDetail extends ErrorGroup {
  message?: string | null
  stackTrace?: (string | StackFrame)[]
  userContext?: UserContext | null
  release?: string | null
  metadata?: Record<string, unknown> | null
  recentOccurrences?: RecentOccurrence[]
  traceId?: string
  insights?: ErrorInsights | null
}

export interface IngestErrorRequest {
  exceptionClass: string
  message: string
  stackTrace: string[]
  level: ErrorLevel
  environment: Environment
  release?: string
  user?: UserContext
}
