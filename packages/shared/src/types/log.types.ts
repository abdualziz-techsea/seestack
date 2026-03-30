export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

export interface LogEntry {
  id: string
  projectId: string
  level: LogLevel
  message: string
  service: string
  traceId?: string
  metadata?: Record<string, unknown>
  timestamp: string
}
