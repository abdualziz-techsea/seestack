import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useErrorDetail } from '../hooks/useErrorDetail'
import { useUpdateErrorStatus } from '../hooks/useUpdateErrorStatus'
import { AiAnalysisPanel } from '../components/AiAnalysisPanel'
import { ErrorInsightsCard } from '../components/ErrorInsightsCard'
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
    <div style={{ padding: 24, maxWidth: 1040, margin: '0 auto' }}>
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
        <div className="rounded-md px-3 py-2 text-[13px]"
          style={{ background: 'var(--danger-ghost)', color: 'var(--danger)' }}>
          {(fetchError as Error).message}
        </div>
      )}
      {!isLoading && !fetchError && !detail && (
        <div className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>Error group not found.</div>
      )}

      {detail && (
        <>
          {/* Header */}
          <div className="mb-4 rounded-lg border p-5"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div className="mb-1 text-[11px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
              {fingerprint?.slice(0, 16)}…
            </div>
            <h1 className="text-[22px] font-semibold"
              style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {detail.exceptionClass}
            </h1>
            <p className="mt-2 font-mono text-[13px]"
              style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
              {detail.message || detail.title}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusBadge status={detail.status} />
              {detail.environment && (
                <Chip label={detail.environment} bg="var(--danger-ghost)" fg="var(--danger)" />
              )}
              {detail.level && (
                <Chip label={detail.level} bg="var(--warning-ghost)" fg="var(--warning)" />
              )}
              <Chip label={`${detail.occurrences} occurrence${detail.occurrences === 1 ? '' : 's'}`}
                bg="var(--bg-active)" fg="var(--text-secondary)" />
              {detail.release && (
                <Chip label={`release ${detail.release}`} bg="var(--bg-active)" fg="var(--text-secondary)" />
              )}
              {currentProject && (
                <Chip label={`project: ${currentProject.name}`}
                  bg="var(--primary-ghost)" fg="var(--primary-text)" />
              )}
              <div className="ms-auto flex gap-2">
                <button
                  disabled={updating || detail.status === 'resolved'}
                  onClick={() => updateStatus({ fingerprint: fingerprint!, status: 'resolved' as ErrorStatus })}
                  className="rounded-md text-[12px] font-medium disabled:opacity-40"
                  style={{ background: 'var(--success-ghost)', color: 'var(--success)', border: 'none', padding: '6px 10px', cursor: 'pointer' }}>
                  Mark resolved
                </button>
                <button
                  disabled={updating || detail.status === 'ignored'}
                  onClick={() => updateStatus({ fingerprint: fingerprint!, status: 'ignored' as ErrorStatus })}
                  className="rounded-md text-[12px] font-medium disabled:opacity-40"
                  style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: 'none', padding: '6px 10px', cursor: 'pointer' }}>
                  Ignore
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
              <span>First seen: <TimeAgo date={detail.firstSeen} /></span>
              <span>Last seen: <TimeAgo date={detail.lastSeen} /></span>
              {detail.traceId && <span className="font-mono">trace: {detail.traceId}</span>}
            </div>
          </div>

          {/* Insights panel */}
          {detail.insights && <ErrorInsightsCard insights={detail.insights} />}

          {/* AI panel */}
          {fingerprint && currentProject && (
            <AiAnalysisPanel fingerprint={fingerprint} projectId={currentProject.id} />
          )}

          {/* Stack trace */}
          {detail.stackTrace && detail.stackTrace.length > 0 && (
            <Section title="Stack trace">
              <pre className="overflow-auto font-mono text-[12px]"
                style={{ padding: 16, color: 'var(--text-primary)', lineHeight: 1.7, whiteSpace: 'pre', maxHeight: 420 }}>
                {detail.stackTrace
                  .map((f: any) => (typeof f === 'string' ? f : `  at ${f.function ?? ''} (${f.file ?? ''}:${f.line ?? ''})`))
                  .join('\n')}
              </pre>
            </Section>
          )}

          {/* Context / metadata */}
          {detail.userContext && (
            <Section title="User context">
              <KeyValueGrid data={detail.userContext as unknown as Record<string, unknown>} />
            </Section>
          )}

          {detail.metadata && Object.keys(detail.metadata).length > 0 && (
            <Section title="Context">
              <KeyValueGrid data={detail.metadata} />
            </Section>
          )}

          {detail.recentOccurrences && detail.recentOccurrences.length > 0 && (
            <Section title={`Recent occurrences (${detail.recentOccurrences.length})`}>
              <table className="w-full text-[12px]">
                <thead>
                  <tr style={{ color: 'var(--text-tertiary)' }}>
                    <th className="px-4 py-2 text-start font-medium">Event ID</th>
                    <th className="px-4 py-2 text-start font-medium">Environment</th>
                    <th className="px-4 py-2 text-start font-medium">Level</th>
                    <th className="px-4 py-2 text-start font-medium">When</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.recentOccurrences.map((o) => (
                    <tr key={o.id} style={{ borderTop: '1px solid var(--border)' }}>
                      <td className="px-4 py-2 font-mono" style={{ color: 'var(--text-secondary)' }}>
                        {o.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-2" style={{ color: 'var(--text-secondary)' }}>{o.environment ?? '—'}</td>
                      <td className="px-4 py-2" style={{ color: 'var(--text-secondary)' }}>{o.level ?? '—'}</td>
                      <td className="px-4 py-2" style={{ color: 'var(--text-tertiary)' }}>
                        <TimeAgo date={o.timestamp} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}
        </>
      )}
    </div>
  )
}

function Chip({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return (
    <span className="rounded-[4px] text-[10px] font-medium"
      style={{ background: bg, color: fg, padding: '2px 6px' }}>{label}</span>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 rounded-lg border"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
      <div className="border-b px-4 py-2 text-[10px] font-semibold uppercase tracking-wider"
        style={{ borderColor: 'var(--border)', color: 'var(--text-tertiary)' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function KeyValueGrid({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data).filter(([, v]) => v !== null && v !== undefined && v !== '')
  return (
    <div className="grid grid-cols-2 gap-3 p-4 text-[12px]">
      {entries.map(([k, v]) => (
        <div key={k}>
          <div style={{ color: 'var(--text-tertiary)', marginBottom: 2 }}>{k}</div>
          <div className="font-mono" style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>
            {typeof v === 'object' ? JSON.stringify(v) : String(v)}
          </div>
        </div>
      ))}
    </div>
  )
}
