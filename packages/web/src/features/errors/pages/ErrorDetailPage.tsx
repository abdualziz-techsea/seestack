import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useErrorDetail } from '../hooks/useErrorDetail'
import { useUpdateErrorStatus } from '../hooks/useUpdateErrorStatus'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TimeAgo } from '@/components/shared/TimeAgo'
import { useAuthStore } from '@/store/auth.store'
import type { ErrorStatus } from '@seestack/shared'

export function ErrorDetailPage() {
  const { fingerprint } = useParams<{ fingerprint: string }>()
  const navigate = useNavigate()
  const { error: detail, isLoading, fetchError } = useErrorDetail(fingerprint)
  const { updateStatus, isLoading: updating } = useUpdateErrorStatus()
  const currentProject = useAuthStore((s) => s.currentProject)

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <button
        onClick={() => navigate('/errors')}
        className="mb-4 inline-flex items-center gap-1.5 text-[12px]"
        style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
      >
        <ArrowLeft size={14} /> Back to errors
      </button>

      {isLoading && (
        <div className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>Loading…</div>
      )}
      {fetchError && (
        <div
          className="rounded-md px-3 py-2 text-[13px]"
          style={{ background: 'var(--danger-ghost)', color: 'var(--danger)' }}
        >
          {(fetchError as Error).message}
        </div>
      )}
      {!isLoading && !fetchError && !detail && (
        <div className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>Error group not found.</div>
      )}

      {detail && (
        <>
          {/* Header */}
          <div
            className="mb-4 rounded-lg border p-5"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="mb-1 text-[11px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
              {fingerprint?.slice(0, 16)}…
            </div>
            <h1 className="text-[22px] font-semibold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {detail.exceptionClass}
            </h1>
            <p
              className="mt-2 font-mono text-[13px]"
              style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}
            >
              {detail.title}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusBadge status={detail.status} />
              {detail.environment && (
                <span
                  className="rounded-[4px] px-1.5 text-[10px] font-medium"
                  style={{ background: 'var(--danger-ghost)', color: 'var(--danger)', padding: '2px 6px' }}
                >
                  {detail.environment}
                </span>
              )}
              {detail.level && (
                <span
                  className="rounded-[4px] px-1.5 text-[10px] font-medium"
                  style={{ background: 'var(--warning-ghost)', color: 'var(--warning)', padding: '2px 6px' }}
                >
                  {detail.level}
                </span>
              )}
              <span
                className="rounded-[4px] text-[10px] font-medium"
                style={{ background: 'var(--bg-active)', color: 'var(--text-secondary)', padding: '2px 6px' }}
              >
                {detail.occurrences} occurrence{detail.occurrences === 1 ? '' : 's'}
              </span>
              {currentProject && (
                <span
                  className="rounded-[4px] text-[10px] font-medium"
                  style={{ background: 'var(--primary-ghost)', color: 'var(--primary-text)', padding: '2px 6px' }}
                >
                  project: {currentProject.name}
                </span>
              )}
              <div className="ms-auto flex gap-2">
                <button
                  disabled={updating || detail.status === 'resolved'}
                  onClick={() =>
                    updateStatus({ fingerprint: fingerprint!, status: 'resolved' as ErrorStatus })
                  }
                  className="rounded-md text-[12px] font-medium disabled:opacity-40"
                  style={{ background: 'var(--success-ghost)', color: 'var(--success)', border: 'none', padding: '6px 10px', cursor: 'pointer' }}
                >
                  Mark resolved
                </button>
                <button
                  disabled={updating || detail.status === 'ignored'}
                  onClick={() =>
                    updateStatus({ fingerprint: fingerprint!, status: 'ignored' as ErrorStatus })
                  }
                  className="rounded-md text-[12px] font-medium disabled:opacity-40"
                  style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: 'none', padding: '6px 10px', cursor: 'pointer' }}
                >
                  Ignore
                </button>
              </div>
            </div>

            <div
              className="mt-4 flex flex-wrap gap-4 text-[12px]"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <span>
                First seen: <TimeAgo date={detail.firstSeen} />
              </span>
              <span>
                Last seen: <TimeAgo date={detail.lastSeen} />
              </span>
            </div>
          </div>

          {/* Stack trace */}
          {detail.stackTrace && detail.stackTrace.length > 0 && (
            <div
              className="mb-4 rounded-lg border"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
            >
              <div
                className="border-b px-4 py-2 text-[10px] font-semibold uppercase tracking-wider"
                style={{ borderColor: 'var(--border)', color: 'var(--text-tertiary)' }}
              >
                Stack trace
              </div>
              <pre
                className="overflow-auto font-mono text-[12px]"
                style={{ padding: 16, color: 'var(--text-primary)', lineHeight: 1.7, whiteSpace: 'pre', maxHeight: 420 }}
              >
                {detail.stackTrace
                  .map((f: any) => (typeof f === 'string' ? f : `  at ${f.function ?? ''} (${f.file ?? ''}:${f.line ?? ''})`))
                  .join('\n')}
              </pre>
            </div>
          )}

          {/* Context / metadata */}
          {detail.userContext && (
            <div
              className="mb-4 rounded-lg border"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
            >
              <div
                className="border-b px-4 py-2 text-[10px] font-semibold uppercase tracking-wider"
                style={{ borderColor: 'var(--border)', color: 'var(--text-tertiary)' }}
              >
                User context
              </div>
              <div className="grid grid-cols-2 gap-3 p-4 text-[12px]">
                {Object.entries(detail.userContext).map(([k, v]) => (
                  <div key={k}>
                    <div style={{ color: 'var(--text-tertiary)', marginBottom: 2 }}>{k}</div>
                    <div className="font-mono" style={{ color: 'var(--text-primary)' }}>{String(v ?? '—')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
