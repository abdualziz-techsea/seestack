import { TrendingUp, Hash, Clock } from 'lucide-react'
import type { ErrorInsights } from '@seestack/shared'

interface Props {
  insights: ErrorInsights
}

export function ErrorInsightsCard({ insights }: Props) {
  const impactPalette: Record<string, { bg: string; fg: string }> = {
    LOW:    { bg: 'var(--success-ghost)', fg: 'var(--success)' },
    MEDIUM: { bg: 'var(--warning-ghost)', fg: 'var(--warning)' },
    HIGH:   { bg: 'var(--danger-ghost)',  fg: 'var(--danger)' },
  }
  const c = impactPalette[insights.impactLevel.toUpperCase()] ?? impactPalette.LOW
  const maxCount = Math.max(1, ...insights.timeline.map((t) => t.count))

  return (
    <div className="mb-4 rounded-lg border"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between border-b px-4 py-2"
        style={{ borderColor: 'var(--border)' }}>
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-tertiary)' }}>
          <TrendingUp size={12} /> Insights
        </span>
        <span className="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase"
          style={{ background: c.bg, color: c.fg }}>
          Impact: {insights.impactLevel}
        </span>
      </div>

      {/* Compact, explainable summary. */}
      <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-3">
        <Stat label="Total occurrences" value={String(insights.totalOccurrences)} />
        <Stat
          label="Recent activity"
          value={insights.recentActivity}
          accent={insights.activeRecently ? 'var(--success)' : 'var(--text-secondary)'}
        />
        <div className="rounded-md border p-2.5"
          style={{ background: 'var(--bg-base)', borderColor: 'var(--border)' }}>
          <div className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-tertiary)' }}>Window</div>
          <div className="mt-1 flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--text-primary)' }}>
            <Clock size={12} style={{ color: 'var(--text-tertiary)' }} />
            <span>
              First seen <Time iso={insights.firstSeen} /> · Last seen <Time iso={insights.lastSeen} />
            </span>
          </div>
        </div>
      </div>

      {/* Patterns */}
      <div className="border-t p-4" style={{ borderColor: 'var(--border)' }}>
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-tertiary)' }}>Detected patterns</div>
        <ul className="list-disc ps-5 text-[12px] leading-relaxed"
          style={{ color: 'var(--text-primary)' }}>
          {insights.patterns.map((p, i) => <li key={i}>{p}</li>)}
        </ul>
      </div>

      {/* Fingerprint explanation */}
      <div className="border-t p-4" style={{ borderColor: 'var(--border)' }}>
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-tertiary)' }}>
          <Hash size={11} /> Why this error is grouped
        </div>
        <div className="grid gap-2 text-[12px] md:grid-cols-3">
          <KV k="Exception class"    v={insights.fingerprint.exceptionClass} />
          <KV k="Normalized message" v={insights.fingerprint.normalizedMessage || '—'} />
          <KV k="Top frame"          v={insights.fingerprint.topFrame || '—'} />
        </div>
        <div className="mt-2 text-[11px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
          {insights.fingerprint.formula}
        </div>
      </div>

      {/* Timeline */}
      <div className="border-t p-4" style={{ borderColor: 'var(--border)' }}>
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-tertiary)' }}>Timeline (last 24 hours)</div>
        {insights.timeline.length === 0 ? (
          <div className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
            No occurrences in the last 24 hours.
          </div>
        ) : (
          <div className="flex h-20 items-end gap-1">
            {insights.timeline.map((t) => {
              const h = Math.max(4, (t.count / maxCount) * 72)
              return (
                <div key={t.bucket}
                  title={`${new Date(t.bucket).toLocaleString()} — ${t.count}`}
                  style={{
                    width: 14, height: h,
                    background: 'var(--primary)',
                    opacity: 0.4 + 0.6 * (t.count / maxCount),
                    borderRadius: 2,
                  }} />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-md border p-2.5"
      style={{ background: 'var(--bg-base)', borderColor: 'var(--border)' }}>
      <div className="text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: 'var(--text-tertiary)' }}>{label}</div>
      <div className="text-[16px] font-semibold tabular-nums"
        style={{ color: accent ?? 'var(--text-primary)' }}>{value}</div>
    </div>
  )
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{k}</div>
      <div className="font-mono" style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{v}</div>
    </div>
  )
}

function Time({ iso }: { iso: string }) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return <span>—</span>
  return <span title={d.toISOString()}>{d.toLocaleString()}</span>
}
