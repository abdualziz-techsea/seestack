import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { securityApi } from '@seestack/shared'
import type { SecurityScan } from '@seestack/shared'
import { ShieldCheck, ShieldAlert, Loader2, Info, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { TimeAgo } from '@/components/shared/TimeAgo'

const PORT_DESCRIPTIONS: Record<number, string> = {
  22: 'SSH', 80: 'HTTP', 443: 'HTTPS', 3306: 'MySQL',
  5432: 'PostgreSQL', 6379: 'Redis', 8080: 'HTTP-alt', 8443: 'HTTPS-alt',
}

const DEFAULT_PORTS = [22, 80, 443, 3306, 5432, 6379, 8080, 8443]
const DEFAULT_HEADERS = ['Strict-Transport-Security', 'Content-Security-Policy', 'X-Frame-Options', 'X-Content-Type-Options']

export function SecurityScanPage() {
  const [target, setTarget] = useState('example.com')
  const [lastResult, setLastResult] = useState<SecurityScan | null>(null)
  const currentProject = useAuthStore((s) => s.currentProject)
  const qc = useQueryClient()

  const listQuery = useQuery({
    queryKey: ['security-scans'],
    queryFn: () => securityApi.list(1, 20).then((r) => r.data),
  })

  const runScan = useMutation({
    mutationFn: (t: string) =>
      securityApi.create(t, currentProject?.id ?? null).then((r) => r.data),
    onSuccess: (data) => {
      setLastResult(data)
      qc.invalidateQueries({ queryKey: ['security-scans'] })
    },
  })

  const items = listQuery.data?.items ?? []
  const scannedPorts = listQuery.data?.scannedPorts ?? DEFAULT_PORTS
  const checkedHeaders = listQuery.data?.checkedHeaders ?? DEFAULT_HEADERS

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Security Scan
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
          Basic Security Analysis — port exposure check, service detection, HTTP/HTTPS inspection,
          and a simple risk score. This is informational only, not a vulnerability scanner.
        </p>
      </div>

      <div className="mb-5 rounded-lg border p-4"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider"
          style={{ color: 'var(--text-tertiary)' }}>Target hostname or domain</label>
        <div className="flex gap-2">
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="example.com"
            className="flex-1 rounded-md px-3 py-2 text-[13px] outline-none"
            style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
          <button
            onClick={() => target.trim() && runScan.mutate(target.trim())}
            disabled={runScan.isPending || !target.trim()}
            className="inline-flex items-center gap-1.5 rounded-md px-4 text-[13px] font-medium disabled:opacity-50"
            style={{ background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            {runScan.isPending ? <><Loader2 size={14} className="animate-spin" /> Analyzing…</> : 'Run analysis'}
          </button>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 text-[11px] md:grid-cols-2" style={{ color: 'var(--text-tertiary)' }}>
          <div>
            <div className="mb-1 font-semibold uppercase tracking-wider">Ports checked</div>
            <div className="flex flex-wrap gap-1.5">
              {scannedPorts.map((p) => (
                <span key={p} className="rounded px-1.5 py-0.5 font-mono"
                  style={{ background: 'var(--bg-active)', color: 'var(--text-secondary)' }}>
                  {p}{PORT_DESCRIPTIONS[p] ? ` · ${PORT_DESCRIPTIONS[p]}` : ''}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1 font-semibold uppercase tracking-wider">Security headers checked</div>
            <div className="flex flex-wrap gap-1.5">
              {checkedHeaders.map((h) => (
                <span key={h} className="rounded px-1.5 py-0.5 font-mono"
                  style={{ background: 'var(--bg-active)', color: 'var(--text-secondary)' }}>{h}</span>
              ))}
            </div>
          </div>
        </div>
        {runScan.isError && (
          <div className="mt-3 rounded px-3 py-2 text-[12px]"
            style={{ background: 'var(--danger-ghost)', color: 'var(--danger)' }}>
            Analysis failed. Check the hostname and try again.
          </div>
        )}
      </div>

      {lastResult && <ScanResultCard scan={lastResult} scannedPorts={scannedPorts} />}

      {/* History */}
      <div className="rounded-lg border"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="border-b px-4 py-2 text-[10px] font-semibold uppercase tracking-wider"
          style={{ borderColor: 'var(--border)', color: 'var(--text-tertiary)' }}>
          Recent analyses
        </div>
        {listQuery.isLoading ? (
          <div className="p-4 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
            No analyses yet. Run one above to get started.
          </div>
        ) : (
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ color: 'var(--text-tertiary)' }}>
                <th className="px-4 py-2 text-start font-medium">Target</th>
                <th className="px-4 py-2 text-start font-medium">Risk</th>
                <th className="px-4 py-2 text-start font-medium">Open ports</th>
                <th className="px-4 py-2 text-start font-medium">Headers</th>
                <th className="px-4 py-2 text-start font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="px-4 py-2 font-mono" style={{ color: 'var(--text-primary)' }}>{s.target}</td>
                  <td className="px-4 py-2"><RiskBadge level={s.riskLevel} score={s.riskScore} /></td>
                  <td className="px-4 py-2">
                    {s.openPorts.length === 0
                      ? <span style={{ color: 'var(--text-tertiary)' }}>none</span>
                      : s.openPorts.map((p) => <PortBadge key={p} port={p} open service={s.detectedServices?.[String(p)]} />)}
                  </td>
                  <td className="px-4 py-2">
                    <HeadersSummary headers={s.securityHeaders} totalChecked={checkedHeaders.length} />
                  </td>
                  <td className="px-4 py-2" style={{ color: 'var(--text-tertiary)' }}>
                    <TimeAgo date={s.createdAt} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function ScanResultCard({ scan, scannedPorts }: { scan: SecurityScan; scannedPorts: number[] }) {
  const failed = scan.status === 'failed'
  const services = scan.detectedServices ?? {}
  const headers = scan.securityHeaders ?? {}
  const httpInfo = (scan.httpInfo ?? {}) as Record<string, unknown>
  const httpUrl = httpInfo.url as string | undefined
  const httpStatus = httpInfo.statusCode as number | undefined
  const httpRt = httpInfo.responseTimeMs as number | undefined
  const httpServer = httpInfo.server as string | undefined
  const httpContentType = httpInfo.contentType as string | undefined

  return (
    <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
      {/* Risk + summary */}
      <div className="lg:col-span-3 rounded-lg border p-4"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="flex flex-wrap items-center gap-3">
          {failed
            ? <ShieldAlert size={20} style={{ color: 'var(--danger)' }} />
            : <ShieldCheck size={20} style={{ color: 'var(--success)' }} />}
          <span className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            {failed ? 'Analysis failed' : 'Security Summary'} — {scan.target}
          </span>
          {scan.resolvedHost && (
            <span className="font-mono text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
              resolved: {scan.resolvedHost}
            </span>
          )}
          <div className="ms-auto"><RiskBadge level={scan.riskLevel} score={scan.riskScore} large /></div>
        </div>
        {failed && scan.errorMessage && (
          <div className="mt-2 text-[12px]" style={{ color: 'var(--danger)' }}>{scan.errorMessage}</div>
        )}
        {!failed && scan.summary && (
          <p className="mt-3 text-[12px]" style={{ color: 'var(--text-secondary)' }}>{scan.summary}</p>
        )}
      </div>

      {/* Detected services */}
      <Section title="Detected services">
        {Object.keys(services).length === 0 ? (
          <Empty>No common services detected on the open ports.</Empty>
        ) : (
          <div className="space-y-1.5 text-[12px]">
            {Object.entries(services).map(([port, label]) => (
              <div key={port} className="flex items-center justify-between">
                <span className="font-mono" style={{ color: 'var(--text-primary)' }}>:{port}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* HTTP/HTTPS inspection */}
      <Section title="HTTP / HTTPS probe">
        {!httpUrl ? (
          <Empty>No web port available for inspection.</Empty>
        ) : (
          <div className="space-y-1.5 text-[12px]">
            <Row k="URL" v={<span className="font-mono" style={{ wordBreak: 'break-all' }}>{httpUrl}</span>} />
            <Row k="Status" v={<span style={{ color: httpStatus && httpStatus < 400 ? 'var(--success)' : 'var(--warning)' }}>{httpStatus || 'no response'}</span>} />
            {typeof httpRt === 'number' && <Row k="Response time" v={`${httpRt} ms`} />}
            {httpServer && <Row k="Server" v={httpServer} />}
            {httpContentType && <Row k="Content-Type" v={httpContentType} />}
          </div>
        )}
      </Section>

      {/* Security headers */}
      <Section title="Security headers">
        {Object.keys(headers).length === 0 ? (
          <Empty>Header check skipped (no HTTP probe).</Empty>
        ) : (
          <ul className="space-y-1 text-[12px]">
            {Object.entries(headers).map(([name, present]) => (
              <li key={name} className="flex items-center gap-2">
                {present
                  ? <CheckCircle2 size={12} style={{ color: 'var(--success)' }} />
                  : <XCircle size={12} style={{ color: 'var(--danger)' }} />}
                <span style={{ color: present ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{name}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Port matrix */}
      <div className="lg:col-span-3 rounded-lg border p-4"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-tertiary)' }}>Port matrix</div>
        <div className="flex flex-wrap gap-1.5">
          {(scan.scannedPorts.length ? scan.scannedPorts : scannedPorts).map((p) => {
            const open = scan.openPorts.includes(p)
            return <PortBadge key={p} port={p} open={open} service={services[String(p)]} />
          })}
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-4"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: 'var(--text-tertiary)' }}>{title}</div>
      {children}
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
      <Info size={12} className="mt-0.5" />{children}
    </div>
  )
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span style={{ color: 'var(--text-tertiary)' }}>{k}</span>
      <span style={{ color: 'var(--text-primary)' }}>{v}</span>
    </div>
  )
}

function HeadersSummary({ headers, totalChecked }: { headers?: Record<string, boolean>; totalChecked: number }) {
  if (!headers || Object.keys(headers).length === 0) {
    return <span style={{ color: 'var(--text-tertiary)' }}>—</span>
  }
  const present = Object.values(headers).filter(Boolean).length
  const colour = present >= totalChecked ? 'var(--success)'
                : present > 0 ? 'var(--warning)' : 'var(--danger)'
  return (
    <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: colour }}>
      <AlertTriangle size={11} /> {present}/{totalChecked}
    </span>
  )
}

function PortBadge({ port, open, service }: { port: number; open: boolean; service?: string }) {
  const label = service ?? PORT_DESCRIPTIONS[port] ?? ''
  return (
    <span
      className="me-1 inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[11px]"
      style={{
        background: open ? 'var(--success-ghost)' : 'var(--bg-active)',
        color: open ? 'var(--success)' : 'var(--text-tertiary)',
      }}
    >
      <span style={{ fontSize: 9 }}>●</span>
      {port}{label ? ` ${label}` : ''}{open ? ' open' : ''}
    </span>
  )
}

function RiskBadge({ level, score, large }: { level?: string; score?: number; large?: boolean }) {
  const palette: Record<string, { bg: string; fg: string }> = {
    LOW:    { bg: 'var(--success-ghost)', fg: 'var(--success)' },
    MEDIUM: { bg: 'var(--warning-ghost)', fg: 'var(--warning)' },
    HIGH:   { bg: 'var(--danger-ghost)',  fg: 'var(--danger)' },
  }
  const lv = (level ?? 'LOW').toUpperCase()
  const c = palette[lv] ?? palette.LOW
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded font-medium uppercase"
      style={{
        background: c.bg, color: c.fg,
        padding: large ? '4px 10px' : '2px 6px',
        fontSize: large ? 12 : 10,
      }}>
      Risk: {lv}{typeof score === 'number' ? ` · ${score}/100` : ''}
    </span>
  )
}
