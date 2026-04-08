import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { Monitor } from '@seestack/shared'

interface MonitorSummaryBarProps {
  monitors: Monitor[]
}

export function MonitorSummaryBar({ monitors }: MonitorSummaryBarProps) {
  const { t } = useTranslation()

  const summary = useMemo(() => {
    const up = monitors.filter((m) => m.status === 'up').length
    const down = monitors.filter((m) => m.status === 'down').length
    const paused = monitors.filter((m) => m.status === 'paused').length
    return { up, down, paused }
  }, [monitors])

  if (monitors.length === 0) return null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 14px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        marginBottom: 20,
        fontSize: 13,
        color: 'var(--text-secondary)',
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }} />
      <strong style={{ color: 'var(--success)' }}>{summary.up}</strong> {t('monitors.up')}

      {summary.down > 0 && (
        <>
          <span style={{ color: 'var(--text-disabled)' }}>&middot;</span>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--danger)', flexShrink: 0 }} />
          <strong style={{ color: 'var(--danger)' }}>{summary.down}</strong> {t('monitors.down')}
        </>
      )}

      {summary.paused > 0 && (
        <>
          <span style={{ color: 'var(--text-disabled)' }}>&middot;</span>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--text-tertiary)', flexShrink: 0 }} />
          <strong style={{ color: 'var(--text-tertiary)' }}>{summary.paused}</strong> {t('monitors.paused', { defaultValue: 'Paused' })}
        </>
      )}
    </div>
  )
}
