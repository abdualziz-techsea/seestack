import { useTranslation } from 'react-i18next'
import { AlertCircle, ArrowDown, ArrowUp, MessageSquare, Terminal } from 'lucide-react'
import { TimeAgo } from '@/components/shared/TimeAgo'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { useOverviewData } from '../hooks/useOverviewData'

const icons: Record<string, { icon: typeof AlertCircle; bg: string; color: string }> = {
  error_spike: { icon: AlertCircle, bg: 'var(--danger-ghost)', color: 'var(--danger)' },
  monitor_down: { icon: ArrowDown, bg: 'var(--danger-ghost)', color: 'var(--danger)' },
  monitor_up: { icon: ArrowUp, bg: 'var(--success-ghost)', color: 'var(--success)' },
  chat_mention: { icon: MessageSquare, bg: 'var(--info-ghost)', color: 'var(--primary)' },
  ssh_session: { icon: Terminal, bg: 'var(--primary-ghost)', color: 'var(--primary-text)' },
}

export function ActivityFeed() {
  const { t } = useTranslation()
  const { data, isLoading } = useOverviewData()
  const activity = data?.activity ?? []

  return (
    <div>
      <div className="mb-2.5">
        <span className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {t('overview.activity', { defaultValue: 'Recent Activity' })}
        </span>
      </div>
      <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)' }}>
        {isLoading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border-b px-3.5 py-2.5" style={{ borderColor: 'var(--border)' }}><SkeletonRow /></div>
        ))}
        {activity.map((a: any) => {
          const cfg = icons[a.type] ?? icons.error_spike
          const Icon = cfg.icon
          return (
            <div key={a.id} className="flex items-start gap-2.5 border-b px-3.5 py-2.5 last:border-b-0" style={{ borderColor: 'var(--border)' }}>
              <div
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                style={{ background: cfg.bg, color: cfg.color }}
              >
                <Icon size={11} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] leading-snug" style={{ color: 'var(--text-primary)' }}>{a.description}</div>
                <div className="mt-0.5 text-[11px]" style={{ color: 'var(--text-tertiary)' }}><TimeAgo date={a.createdAt} /></div>
              </div>
            </div>
          )
        })}
        {!isLoading && activity.length === 0 && (
          <div className="py-6 text-center text-[13px]" style={{ color: 'var(--text-tertiary)' }}>{t('empty.noActivity')}</div>
        )}
      </div>
    </div>
  )
}
