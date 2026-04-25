import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Gauge, AlertTriangle, Loader2 } from 'lucide-react'
import { loadTestApi, monitorsApi } from '@seestack/shared'
import type { LoadTest, Monitor } from '@seestack/shared'
import { useAuthStore } from '@/store/auth.store'
import { TimeAgo } from '@/components/shared/TimeAgo'

const DEFAULT_LIMITS = {
  maxRequests: 100,
  maxConcurrency: 10,
  timeoutSeconds: 5,
  cooldownSeconds: 60,
}

export function LoadTestPage() {
  const currentProject = useAuthStore((s) => s.currentProject)
  const projectId = currentProject?.id

  const monitorsQuery = useQuery({
    queryKey: ['monitors', projectId],
    queryFn: () => monitorsApi.list(projectId!).then((r) => r.data),
    enabled: !!projectId,
  })
  const monitors: Monitor[] = (monitorsQuery.data as any)?.items ?? (monitorsQuery.data as any) ?? []

  const listQuery = useQuery({
    queryKey: ['load-tests', projectId],
    queryFn: () => loadTestApi.list(projectId!, 1, 20).then((r) => r.data),
    enabled: !!projectId,
  })
  const limits = listQuery.data?.limits ?? DEFAULT_LIMITS
  const items = listQuery.data?.items ?? []

  const [monitorId, setMonitorId] = useState('')
  const [requests, setRequests] = useState(20)
  const [concurrency, setConcurrency] = useState(5)
  const [latest, setLatest] = useState<LoadTest | null>(null)
  const [error, setError] = useState<string | null>(null)
  const qc = useQueryClient()

  const selectedMonitor = useMemo(
    () => monitors.find((m) => m.id === monitorId) ?? monitors[0],
    [monitors, monitorId]
  )

  const run = useMutation({
    mutationFn: () =>
      loadTestApi.create({
        projectId: projectId!,
        monitorId: selectedMonitor!.id,
        requests,
        concurrency,
      }).then((r) => r.data),
    onSuccess: (data) => {
      setLatest(data)
      setError(null)
      qc.invalidateQueries({ queryKey: ['load-tests', projectId] })
    },
    onError: (e: any) => {
      const code = e?.error?.code
      if (code === 'COOLDOWN_ACTIVE') {
        const secs = e?.error?.details?.remainingSeconds ?? limits.cooldownSeconds
        setError(`Cooldown active for this target. Try again in ${secs}s.`)
      } else {
        setError(e?.error?.message ?? 'Load test failed.')
      }
    },
  })

  const canRun = !!selectedMonitor && !run.isPending

  return (
    <div style={{ padding: 24, maxWidth: 1040, margin: '0 auto' }}>
      <div className="mb-5">
        <h1 className="text-[22px] font-semibold"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Load Test
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
          Basic Load Test — runs a small, controlled volume of HTTP GETs against a URL
          you already monitor, using only the JDK HttpClient. This is not a stress test
          or attack tool.
        </p>
      </div>

      <div className="mb-4 flex items-start gap-2 rounded-md px-3 py-2 text-[12px]"
        style={{ background: 'var(--warning-ghost)', color: 'var(--warning)' }}>
        <AlertTriangle size={14} className="mt-0.5" />
        <span>
          Only test websites you own or are authorized to test. Targets are restricted to URLs
          you have already saved as monitors. Per-target cooldown of {limits.cooldownSeconds}s is enforced.
        </span>
      </div>

      {/* Config */}
      <div className="mb-5 rounded-lg border p-4"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Field label="Target (existing monitor)">
            <select
              value={selectedMonitor?.id ?? ''}
              onChange={(e) => setMonitorId(e.target.value)}
              className="w-full rounded-md px-3 py-2 text-[13px] outline-none"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            >
              {monitors.length === 0 && <option value="">No monitors — add one first</option>}
              {monitors.map((m) => (
                <option key={m.id} value={m.id}>{m.name} — {m.url}</option>
              ))}
            </select>
          </Field>
          <Field label={`Requests (1–${limits.maxRequests})`}>
            <input
              type="number" min={1} max={limits.maxRequests}
              value={requests}
              onChange={(e) => setRequests(clamp(parseInt(e.target.value || '1', 10), 1, limits.maxRequests))}
              className="w-full rounded-md px-3 py-2 text-[13px] outline-none"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </Field>
          <Field label={`Concurrency (1–${limits.maxConcurrency})`}>
            <input
              type="number" min={1} max={limits.maxConcurrency}
              value={concurrency}
              onChange={(e) => setConcurrency(clamp(parseInt(e.target.value || '1', 10), 1, limits.maxConcurrency))}
              className="w-full rounded-md px-3 py-2 text-[13px] outline-none"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </Field>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
            Per-request timeout {limits.timeoutSeconds}s · Hard caps:
            {' '}max {limits.maxRequests} requests, max {limits.maxConcurrency} concurrent
          </div>
          <button
            disabled={!canRun}
            onClick={() => run.mutate()}
            className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-[13px] font-medium disabled:opacity-50"
            style={{ background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            {run.isPending ? <><Loader2 size={14} className="animate-spin" /> Running…</> : <><Gauge size={14} /> Run load test</>}
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded px-3 py-2 text-[12px]"
            style={{ background: 'var(--danger-ghost)', color: 'var(--danger)' }}>{error}</div>
        )}
      </div>

      {latest && <ResultCard test={latest} />}

      {/* History */}
      <div className="rounded-lg border"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="border-b px-4 py-2 text-[10px] font-semibold uppercase tracking-wider"
          style={{ borderColor: 'var(--border)', color: 'var(--text-tertiary)' }}>
          Recent load tests
        </div>
        {listQuery.isLoading ? (
          <div className="p-4 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
            No load tests yet. Run one above.
          </div>
        ) : (
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ color: 'var(--text-tertiary)' }}>
                <th className="px-4 py-2 text-start font-medium">Target</th>
                <th className="px-4 py-2 text-start font-medium">Status</th>
                <th className="px-4 py-2 text-end font-medium">Total</th>
                <th className="px-4 py-2 text-end font-medium">Success</th>
                <th className="px-4 py-2 text-end font-medium">Avg ms</th>
                <th className="px-4 py-2 text-end font-medium">P95 ms</th>
                <th className="px-4 py-2 text-start font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="px-4 py-2 font-mono" style={{ color: 'var(--text-primary)' }}>{t.targetUrl}</td>
                  <td className="px-4 py-2"><StatusPill status={t.status} /></td>
                  <td className="px-4 py-2 text-end font-mono" style={{ color: 'var(--text-secondary)' }}>{t.totalRequests}</td>
                  <td className="px-4 py-2 text-end font-mono" style={{ color: 'var(--success)' }}>{t.successfulRequests}</td>
                  <td className="px-4 py-2 text-end font-mono" style={{ color: 'var(--text-secondary)' }}>{Math.round(t.avgResponseTimeMs)}</td>
                  <td className="px-4 py-2 text-end font-mono" style={{ color: 'var(--text-secondary)' }}>{t.p95ResponseTimeMs}</td>
                  <td className="px-4 py-2" style={{ color: 'var(--text-tertiary)' }}><TimeAgo date={t.createdAt} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function ResultCard({ test }: { test: LoadTest }) {
  const successRate = test.totalRequests > 0
    ? Math.round((test.successfulRequests / test.totalRequests) * 100)
    : 0

  const dist = Object.entries(test.statusCodeDistribution || {})
  const maxCount = Math.max(1, ...dist.map(([, v]) => v))

  return (
    <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
      <Stat label="Total requests" value={test.totalRequests} />
      <Stat label="Successful" value={test.successfulRequests} accent="var(--success)" />
      <Stat label="Failed" value={test.failedRequests} accent={test.failedRequests > 0 ? 'var(--danger)' : undefined} />
      <Stat label="Success rate" value={`${successRate}%`} accent="var(--primary-text)" />
      <Stat label="Avg response" value={`${Math.round(test.avgResponseTimeMs)} ms`} />
      <Stat label="P95" value={`${test.p95ResponseTimeMs} ms`} />
      <Stat label="Min" value={`${test.minResponseTimeMs} ms`} />
      <Stat label="Max" value={`${test.maxResponseTimeMs} ms`} />
      <div className="md:col-span-3 rounded-lg border p-4"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-tertiary)' }}>
          Status code distribution
        </div>
        {dist.length === 0 ? (
          <div className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>No samples.</div>
        ) : (
          <div className="space-y-1.5">
            {dist.map(([code, count]) => (
              <div key={code} className="flex items-center gap-3">
                <span className="w-12 font-mono text-[12px]" style={{ color: 'var(--text-secondary)' }}>{code}</span>
                <div className="flex-1 overflow-hidden rounded"
                  style={{ background: 'var(--bg-active)', height: 8 }}>
                  <div style={{
                    width: `${(count / maxCount) * 100}%`,
                    height: '100%',
                    background: code === 'error' || code.startsWith('5') ? 'var(--danger)'
                      : code.startsWith('4') ? 'var(--warning)' : 'var(--success)',
                  }} />
                </div>
                <span className="w-10 text-end font-mono text-[12px]" style={{ color: 'var(--text-primary)' }}>{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider"
        style={{ color: 'var(--text-tertiary)' }}>{label}</label>
      {children}
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <div className="rounded-lg border p-3"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: 'var(--text-tertiary)' }}>{label}</div>
      <div className="text-[20px] font-semibold" style={{ color: accent ?? 'var(--text-primary)' }}>{value}</div>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string }> = {
    completed: { bg: 'var(--success-ghost)', fg: 'var(--success)' },
    failed:    { bg: 'var(--danger-ghost)',  fg: 'var(--danger)' },
    pending:   { bg: 'var(--warning-ghost)', fg: 'var(--warning)' },
  }
  const c = map[status] ?? { bg: 'var(--bg-active)', fg: 'var(--text-secondary)' }
  return (
    <span className="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase"
      style={{ background: c.bg, color: c.fg }}>{status}</span>
  )
}

function clamp(n: number, min: number, max: number) {
  if (Number.isNaN(n)) return min
  return Math.min(Math.max(n, min), max)
}
