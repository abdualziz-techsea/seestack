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

export interface ErrorDetail extends ErrorGroup {
  stackTrace?: StackFrame[]
  userContext?: UserContext
  release?: string
  metadata?: Record<string, unknown>
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
