import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { useMonitors } from '../../monitors/hooks/useMonitors'
import type { Monitor } from '@seestack/shared'

const statusColors: Record<string, string> = { up: 'var(--success)', down: 'var(--danger)', degraded: 'var(--warning)' }
const msColor = (ms: number) => ms > 500 ? 'var(--danger)' : ms > 300 ? 'var(--warning)' : 'var(--success)'

export function MonitorStatusList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { monitors, isLoading } = useMonitors()

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {t('overview.monitorStatus', { defaultValue: 'Monitor Status' })}
        </span>
        <button onClick={() => navigate('/monitors')} className="text-xs font-medium hover:underline" style={{ color: 'var(--primary-text)' }}>
          {t('common.viewAll')} →
        </button>
      </div>
      <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)' }}>
        {isLoading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border-b px-3.5 py-2" style={{ borderColor: 'var(--border)' }}><SkeletonRow /></div>
        ))}
        {monitors.map((m: Monitor) => (
          <div key={m.id} className="flex items-center gap-2 border-b px-3.5 py-2 text-[13px] last:border-b-0" style={{ borderColor: 'var(--border)' }}>
            <span className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ background: statusColors[m.status] ?? 'var(--text-tertiary)' }} />
            <span className="flex-1 font-medium" style={{ color: 'var(--text-primary)' }}>{m.name}</span>
            <span className="font-mono text-xs" style={{ color: m.lastResponseTimeMs ? msColor(m.lastResponseTimeMs) : 'var(--text-tertiary)' }}>
              {m.status === 'down' ? 'DOWN' : `${m.lastResponseTimeMs ?? '—'}ms`}
            </span>
          </div>
        ))}
        {!isLoading && monitors.length === 0 && (
          <div className="py-6 text-center text-[13px]" style={{ color: 'var(--text-tertiary)' }}>{t('empty.noMonitors')}</div>
        )}
      </div>
    </div>
  )
}
