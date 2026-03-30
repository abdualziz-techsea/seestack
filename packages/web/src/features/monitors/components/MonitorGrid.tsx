import { useTranslation } from 'react-i18next'
import { MonitorCard } from './MonitorCard'
import type { Monitor } from '@allstak/shared'

interface MonitorGridProps {
  monitors: Monitor[]
  isLoading: boolean
  onEdit: (m: Monitor) => void
  onToggle: (m: Monitor) => void
  onDelete: (m: Monitor) => void
}

function SkeletonCard() {
  return (
    <div
      className="animate-pulse"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: 16,
        height: 160,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--bg-elevated)' }} />
        <div style={{ height: 14, width: '60%', borderRadius: 4, background: 'var(--bg-elevated)' }} />
      </div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
        <div style={{ height: 30, width: 60, borderRadius: 4, background: 'var(--bg-elevated)' }} />
        <div style={{ height: 30, width: 60, borderRadius: 4, background: 'var(--bg-elevated)' }} />
      </div>
      <div style={{ height: 14, width: '40%', borderRadius: 4, background: 'var(--bg-elevated)' }} />
    </div>
  )
}

export function MonitorGrid({ monitors, isLoading, onEdit, onToggle, onDelete }: MonitorGridProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  if (monitors.length === 0) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center', fontSize: 13, color: 'var(--text-tertiary)' }}>
        {t('empty.noMonitors')}
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      {monitors.map((m) => (
        <MonitorCard key={m.id} monitor={m} onEdit={onEdit} onToggle={onToggle} onDelete={onDelete} />
      ))}
    </div>
  )
}
