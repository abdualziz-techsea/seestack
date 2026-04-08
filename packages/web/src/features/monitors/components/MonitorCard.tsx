import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import type { Monitor } from '@seestack/shared'

const statusColors: Record<string, string> = {
  up: 'var(--success)',
  down: 'var(--danger)',
  paused: 'var(--text-tertiary)',
  pending: 'var(--text-disabled)',
}

const statusBgColors: Record<string, string> = {
  up: 'var(--success-ghost)',
  down: 'var(--danger-ghost)',
  paused: 'var(--bg-active)',
  pending: 'var(--bg-active)',
}

function extractHost(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

interface MonitorCardProps {
  monitor: Monitor
  onEdit: (m: Monitor) => void
  onToggle: (m: Monitor) => void
  onDelete: (m: Monitor) => void
}

export function MonitorCard({ monitor, onEdit, onToggle, onDelete }: MonitorCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const color = statusColors[monitor.status] ?? statusColors.pending
  const bgColor = statusBgColors[monitor.status] ?? statusBgColors.pending

  const respText = monitor.status === 'down'
    ? 'TIMEOUT'
    : monitor.lastResponseTimeMs > 0
      ? `${monitor.lastResponseTimeMs}ms`
      : '—'

  const respColor = monitor.status === 'down'
    ? 'var(--danger)'
    : monitor.lastResponseTimeMs > 500
      ? 'var(--warning)'
      : 'var(--text-primary)'

  return (
    <div
      onClick={() => navigate(`/monitors/${monitor.id}`)}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: 16,
        transition: 'border-color 0.12s',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
    >
      {/* Header: dot + url + status badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'var(--font-mono)', letterSpacing: '-0.01em' }}>
          {extractHost(monitor.url)}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 10,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            padding: '2px 8px',
            borderRadius: 4,
            background: bgColor,
            color,
          }}
        >
          {t(`monitors.${monitor.status}`, { defaultValue: monitor.status })}
        </span>
      </div>

      {/* Metrics: Response + Uptime */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 1 }}>
            {t('monitors.responseTime')}
          </span>
          <span style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-mono)', color: respColor }}>
            {respText}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 1 }}>
            {t('monitors.uptime')}
          </span>
          <span style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
            {monitor.uptimePercentage > 0 ? `${monitor.uptimePercentage}%` : '—'}
          </span>
        </div>
      </div>

      {/* Footer: interval + actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
          {t('monitors.everyInterval', { value: monitor.intervalMinutes })}
        </span>
        <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
          <ActionBtn label={t('monitors.edit', { defaultValue: 'Edit' })} onClick={() => onEdit(monitor)} />
          <ActionBtn
            label={monitor.isActive ? t('monitors.pauseAction', { defaultValue: 'Pause' }) : t('monitors.resumeAction', { defaultValue: 'Resume' })}
            onClick={() => onToggle(monitor)}
          />
          <ActionBtn label={t('monitors.deleteAction', { defaultValue: 'Delete' })} danger onClick={() => onDelete(monitor)} />
        </div>
      </div>
    </div>
  )
}

function ActionBtn({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 26,
        padding: '0 8px',
        border: '1px solid var(--border)',
        borderRadius: 4,
        background: 'transparent',
        color: 'var(--text-secondary)',
        fontFamily: 'inherit',
        fontSize: 11,
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.12s',
      }}
      onMouseEnter={(e) => {
        if (danger) {
          e.currentTarget.style.background = 'var(--danger-ghost)'
          e.currentTarget.style.color = 'var(--danger)'
          e.currentTarget.style.borderColor = 'transparent'
        } else {
          e.currentTarget.style.background = 'var(--bg-hover)'
          e.currentTarget.style.color = 'var(--text-primary)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = 'var(--text-secondary)'
        e.currentTarget.style.borderColor = 'var(--border)'
      }}
    >
      {label}
    </button>
  )
}
