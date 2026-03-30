export type TriggerType =
  | 'error_spike'
  | 'new_error'
  | 'monitor_down'
  | 'monitor_response_time'
  | 'ssh_session_started'

export type ChannelType = 'slack' | 'discord' | 'email' | 'push'
export type SeverityFilter = 'all' | 'critical'

export interface TriggerConfig {
  threshold?: number
  windowMinutes?: number
  thresholdMs?: number
  serverIds?: string[]
}

export interface NotificationChannel {
  type: ChannelType
  webhookUrl?: string
  to?: string[]
}

export interface AlertRule {
  id: string
  projectId: string
  name: string
  triggerType: TriggerType
  triggerConfig: TriggerConfig
  severityFilter: SeverityFilter
  quietHoursEnabled: boolean
  quietStart: string
  quietEnd: string
  channels: NotificationChannel[]
  isEnabled: boolean
  createdAt: string
}
