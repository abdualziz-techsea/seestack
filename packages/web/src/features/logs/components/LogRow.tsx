import { memo } from 'react'
import type { LogEntry } from '@seestack/shared'
import { LogMetadataExpand } from './LogMetadataExpand'

const levelStyles: Record<string, { bg: string; color: string; fontWeight?: number }> = {
  debug: { bg: 'var(--bg-active)', color: 'var(--text-tertiary)' },
  info: { bg: 'rgba(62,207,142,0.12)', color: 'var(--success)' },
  warn: { bg: 'var(--warning-ghost)', color: '#d4890a' },
  error: { bg: 'var(--danger-ghost)', color: 'var(--danger)' },
  fatal: { bg: 'var(--danger-ghost)', color: 'var(--danger)', fontWeight: 700 },
}

function formatTimestamp(ts: string): string {
  const d = new Date(ts)
  const pad = (n: number, len = 2) => String(n).padStart(len, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`
}

interface LogRowProps {
  log: LogEntry
  isExpanded: boolean
  onToggle: () => void
}

export const LogRow = memo(function LogRow({ log, isExpanded, onToggle }: LogRowProps) {
  const lvl = levelStyles[log.level] ?? levelStyles.debug

  return (
    <>
      <tr
        className="log-row"
        onClick={onToggle}
        style={{
          cursor: 'pointer',
          transition: 'background 0.08s',
        }}
      >
        <td
          style={{
            padding: '0 12px',
            borderBottom: isExpanded ? 'none' : '1px solid var(--border)',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-tertiary)',
            width: 170,
            height: 32,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            background: isExpanded ? 'var(--primary-ghost)' : undefined,
          }}
        >
          {formatTimestamp(log.timestamp)}
        </td>
        <td
          style={{
            padding: '0 12px',
            borderBottom: isExpanded ? 'none' : '1px solid var(--border)',
            width: 70,
            height: 32,
            verticalAlign: 'middle',
            background: isExpanded ? 'var(--primary-ghost)' : undefined,
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              height: 18,
              padding: '0 6px',
              borderRadius: 4,
              fontSize: 10,
              fontWeight: lvl.fontWeight ?? 600,
              letterSpacing: '0.02em',
              fontFamily: 'var(--font-mono)',
              background: lvl.bg,
              color: lvl.color,
              textTransform: log.level === 'fatal' ? 'uppercase' : undefined,
            }}
          >
            {log.level.toUpperCase()}
          </span>
        </td>
        <td
          style={{
            padding: '0 12px',
            borderBottom: isExpanded ? 'none' : '1px solid var(--border)',
            width: 90,
            height: 32,
            color: 'var(--text-secondary)',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            background: isExpanded ? 'var(--primary-ghost)' : undefined,
          }}
        >
          {log.service}
        </td>
        <td
          style={{
            padding: '0 12px',
            borderBottom: isExpanded ? 'none' : '1px solid var(--border)',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--text-primary)',
            height: 32,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: 0,
            background: isExpanded ? 'var(--primary-ghost)' : undefined,
          }}
        >
          {log.message}
        </td>
      </tr>
      {log.metadata && (
        <LogMetadataExpand metadata={log.metadata} visible={isExpanded} />
      )}
    </>
  )
})
