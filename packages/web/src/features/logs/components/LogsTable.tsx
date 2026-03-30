import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { LogEntry } from '@allstak/shared'
import { LogRow } from './LogRow'

interface LogsTableProps {
  logs: LogEntry[]
  isLoading: boolean
  expandedId: string | null
  onToggleExpand: (id: string) => void
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i}>
          {[170, 70, 90, undefined].map((w, j) => (
            <td
              key={j}
              style={{
                padding: '0 12px',
                height: 32,
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div
                className="animate-pulse"
                style={{
                  height: 14,
                  borderRadius: 4,
                  background: 'var(--bg-elevated)',
                  width: w ? '80%' : '60%',
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export function LogsTable({ logs, isLoading, expandedId, onToggleExpand }: LogsTableProps) {
  const { t } = useTranslation()

  const handleToggle = useCallback(
    (id: string) => onToggleExpand(id),
    [onToggleExpand],
  )

  const headers = [
    t('logs.timestamp'),
    t('logs.level'),
    t('logs.service'),
    t('logs.message'),
  ]

  return (
    <div style={{ overflow: 'auto', flex: 1 }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
        }}
      >
        <thead>
          <tr>
            {headers.map((col) => (
              <th
                key={col}
                style={{
                  textAlign: 'left',
                  padding: '6px 12px',
                  fontSize: 10,
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--text-tertiary)',
                  borderBottom: '1px solid var(--border-strong)',
                  position: 'sticky',
                  top: 0,
                  background: 'var(--bg-base)',
                  zIndex: 2,
                }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading && <SkeletonRows />}
          {!isLoading &&
            logs.map((log) => (
              <LogRow
                key={log.id}
                log={log}
                isExpanded={expandedId === log.id}
                onToggle={() => handleToggle(log.id)}
              />
            ))}
          {!isLoading && logs.length === 0 && (
            <tr>
              <td
                colSpan={4}
                style={{
                  padding: '48px 12px',
                  textAlign: 'center',
                  fontSize: 13,
                  color: 'var(--text-tertiary)',
                }}
              >
                {t('logs.noResults')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
