import { useTranslation } from 'react-i18next'

const statusConfig: Record<string, { bg: string; color: string; dotColor: string; labelKey: string }> = {
  unresolved: { bg: 'var(--warning-ghost)', color: 'var(--warning-text)', dotColor: 'var(--warning)', labelKey: 'errors.unresolved' },
  resolved: { bg: 'var(--success-ghost)', color: 'var(--success)', dotColor: 'var(--success)', labelKey: 'errors.resolved' },
  ignored: { bg: 'var(--bg-active)', color: 'var(--text-tertiary)', dotColor: 'var(--text-disabled)', labelKey: 'errors.ignored' },
  up: { bg: 'var(--success-ghost)', color: 'var(--success)', dotColor: 'var(--success)', labelKey: 'monitors.up' },
  down: { bg: 'var(--danger-ghost)', color: 'var(--danger)', dotColor: 'var(--danger)', labelKey: 'monitors.down' },
  degraded: { bg: 'var(--warning-ghost)', color: 'var(--warning-text)', dotColor: 'var(--warning)', labelKey: 'monitors.degraded' },
  active: { bg: 'var(--success-ghost)', color: 'var(--success)', dotColor: 'var(--success)', labelKey: 'common.active' },
  paused: { bg: 'var(--bg-active)', color: 'var(--text-tertiary)', dotColor: 'var(--text-disabled)', labelKey: 'common.paused' },
}

interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useTranslation()
  const config = statusConfig[status] ?? { bg: 'var(--bg-active)', color: 'var(--text-secondary)', dotColor: 'var(--text-disabled)', labelKey: status }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        height: 22,
        padding: '0 8px',
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 500,
        background: config.bg,
        color: config.color,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: config.dotColor, flexShrink: 0 }} />
      {t(config.labelKey, { defaultValue: status })}
    </span>
  )
}
