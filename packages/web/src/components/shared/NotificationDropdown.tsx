import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Activity,
  CreditCard,
  MessageSquare,
  Clock,
  CheckCheck,
  Loader2,
  BellOff,
} from 'lucide-react'
import type { NotificationItem } from '@seestack/shared'
import { cn } from '@seestack/shared'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(dateStr).toLocaleDateString()
}

interface Props {
  notifications: NotificationItem[]
  loading: boolean
  error: string | null
  unreadCount: number
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
}

const TRIGGER_META: Record<string, { icon: React.ReactNode; label: string; route: string }> = {
  error_spike: {
    icon: <AlertTriangle size={14} />,
    label: 'Error Spike',
    route: '/errors',
  },
  new_error: {
    icon: <AlertTriangle size={14} />,
    label: 'New Error',
    route: '/errors',
  },
  monitor_down: {
    icon: <Activity size={14} />,
    label: 'Monitor Down',
    route: '/monitors',
  },
  monitor_response_time: {
    icon: <Activity size={14} />,
    label: 'Monitor Slow',
    route: '/monitors',
  },
  ssh_session_started: {
    icon: <Clock size={14} />,
    label: 'SSH Session',
    route: '/ssh',
  },
  billing: {
    icon: <CreditCard size={14} />,
    label: 'Billing',
    route: '/billing',
  },
  chat_mention: {
    icon: <MessageSquare size={14} />,
    label: 'Chat Mention',
    route: '/chat',
  },
}

function getColorForTrigger(triggerType: string, status: string) {
  if (status === 'failed') return 'var(--danger)'
  if (triggerType.startsWith('error') || triggerType === 'monitor_down') return 'var(--danger)'
  if (triggerType.startsWith('monitor')) return 'var(--warning)'
  return 'var(--primary)'
}

function getBgForTrigger(triggerType: string, status: string) {
  if (status === 'failed') return 'var(--danger-ghost)'
  if (triggerType.startsWith('error') || triggerType === 'monitor_down') return 'var(--danger-ghost)'
  if (triggerType.startsWith('monitor')) return 'var(--warning-ghost)'
  return 'var(--primary-ghost)'
}

function NotificationRow({
  item,
  onMarkRead,
  onNavigate,
}: {
  item: NotificationItem
  onMarkRead: (id: string) => void
  onNavigate: (route: string) => void
}) {
  const meta = TRIGGER_META[item.triggerType] ?? {
    icon: <AlertTriangle size={14} />,
    label: item.triggerType,
    route: '/alerts',
  }
  const color = getColorForTrigger(item.triggerType, item.status)
  const bg = getBgForTrigger(item.triggerType, item.status)
  const ago = timeAgo(item.sentAt)

  return (
    <div
      className={cn(
        'group relative flex cursor-pointer gap-3 px-4 py-3 transition-colors hover:bg-[var(--bg-hover)]',
        !item.isRead && 'bg-[var(--bg-raised)]'
      )}
      onClick={() => {
        if (!item.isRead) onMarkRead(item.id)
        onNavigate(meta.route)
      }}
    >
      {/* Unread dot */}
      {!item.isRead && (
        <span
          className="absolute end-3 top-3 h-1.5 w-1.5 rounded-full"
          style={{ background: 'var(--primary)' }}
        />
      )}

      {/* Icon */}
      <div
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
        style={{ background: bg, color }}
      >
        {meta.icon}
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span
            className="truncate text-[13px] font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            {meta.label}
          </span>
          <span className="shrink-0 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
            {ago}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[12px]" style={{ color: 'var(--text-secondary)' }}>
          via {item.channelType}
          {item.status === 'failed' && ' · failed'}
          {item.errorMessage && ` · ${item.errorMessage}`}
        </p>
      </div>
    </div>
  )
}

export function NotificationDropdown({
  notifications,
  loading,
  error,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
}: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div
      className="animate-scale-in absolute end-0 top-full z-50 mt-1 flex w-[360px] flex-col overflow-hidden rounded-xl border shadow-xl"
      style={{ background: 'var(--bg-overlay)', borderColor: 'var(--border)', maxHeight: 480 }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            {t('notifications.title', { defaultValue: 'Notifications' })}
          </span>
          {unreadCount > 0 && (
            <span
              className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
              style={{ background: 'var(--primary)', color: '#fff' }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onMarkAllRead()
            }}
            className="flex items-center gap-1 rounded px-2 py-1 text-[12px] transition-colors hover:bg-[var(--bg-hover)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            <CheckCheck size={13} />
            {t('notifications.markAllRead', { defaultValue: 'Mark all read' })}
          </button>
        )}
      </div>

      {/* Body */}
      <div className="overflow-y-auto" style={{ maxHeight: 400 }}>
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-tertiary)' }} />
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center gap-2 py-12">
            <AlertTriangle size={20} style={{ color: 'var(--danger)' }} />
            <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              {t('notifications.errorLoading', { defaultValue: 'Failed to load notifications' })}
            </p>
          </div>
        )}

        {!loading && !error && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-12">
            <BellOff size={24} style={{ color: 'var(--text-disabled)' }} />
            <p className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
              {t('notifications.empty', { defaultValue: 'No notifications yet' })}
            </p>
            <p className="text-[12px]" style={{ color: 'var(--text-disabled)' }}>
              {t('notifications.emptyDesc', {
                defaultValue: 'Alert events will appear here',
              })}
            </p>
          </div>
        )}

        {!loading &&
          !error &&
          notifications.map((n) => (
            <NotificationRow
              key={n.id}
              item={n}
              onMarkRead={onMarkRead}
              onNavigate={(route) => navigate(route)}
            />
          ))}
      </div>

      {/* Footer */}
      {!loading && notifications.length > 0 && (
        <div
          className="px-4 py-2.5"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <button
            onClick={() => navigate('/alerts')}
            className="text-[12px] transition-colors hover:underline"
            style={{ color: 'var(--primary-text)' }}
          >
            {t('notifications.viewAll', { defaultValue: 'View all in Alerts' })}
          </button>
        </div>
      )}
    </div>
  )
}
