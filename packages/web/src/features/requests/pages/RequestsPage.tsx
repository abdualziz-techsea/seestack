import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowDownLeft, ArrowUpRight, Clock, AlertTriangle, Zap } from 'lucide-react'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { TimeAgo } from '@/components/shared/TimeAgo'
import { useHttpRequests } from '../hooks/useHttpRequests'
import { useHttpRequestStats } from '../hooks/useHttpRequestStats'
import type { HttpRequestEntry } from '@allstak/shared'

const methods = ['ALL', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const
const directions = ['ALL', 'inbound', 'outbound'] as const
const statusGroups = ['ALL', '2xx', '3xx', '4xx', '5xx'] as const

function statusColor(code: number): string {
  if (code >= 500) return 'var(--danger)'
  if (code >= 400) return 'var(--warning-text)'
  if (code >= 300) return 'var(--info)'
  return 'var(--success)'
}

function durationColor(ms: number): string {
  if (ms > 1000) return 'var(--danger)'
  if (ms > 300) return 'var(--warning-text)'
  return 'var(--success)'
}

export function RequestsPage() {
  const { t } = useTranslation()
  const [direction, setDirection] = useState<string>('ALL')
  const [method, setMethod] = useState<string>('ALL')
  const [statusGroup, setStatusGroup] = useState<string>('ALL')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<HttpRequestEntry | null>(null)

  const params = useMemo(() => ({
    direction: direction === 'ALL' ? undefined : direction,
    method: method === 'ALL' ? undefined : method,
    statusGroup: statusGroup === 'ALL' ? undefined : statusGroup,
    path: search || undefined,
    page,
    perPage: 50,
  }), [direction, method, statusGroup, search, page])

  const { requests, pagination, isLoading } = useHttpRequests(params)
  const { stats } = useHttpRequestStats()

  return (
    <div className="animate-fade space-y-5">
      {/* Header */}
      <div className="animate-in flex items-center justify-between">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          {t('requests.title')}
        </h1>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="animate-in stagger-1 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label={t('requests.totalRequests')}
            value={stats.totalRequests.toLocaleString()}
            icon={<Zap size={14} />}
          />
          <StatCard
            label={t('requests.errorRate')}
            value={`${(stats.errorRate * 100).toFixed(1)}%`}
            icon={<AlertTriangle size={14} />}
            color={stats.errorRate > 0.05 ? 'var(--danger)' : 'var(--success)'}
          />
          <StatCard
            label={t('requests.p95Latency')}
            value={`${stats.p95}ms`}
            icon={<Clock size={14} />}
            color={durationColor(stats.p95)}
          />
          <StatCard
            label={t('requests.p99Latency')}
            value={`${stats.p99}ms`}
            icon={<Clock size={14} />}
            color={durationColor(stats.p99)}
          />
        </div>
      )}

      {/* Filters */}
      <div className="animate-in stagger-2 flex flex-wrap items-center gap-2">
        {/* Direction */}
        <FilterGroup
          options={directions as unknown as string[]}
          value={direction}
          onChange={(v) => { setDirection(v); setPage(1) }}
          labels={{ ALL: t('requests.all'), inbound: t('requests.inbound'), outbound: t('requests.outbound') }}
        />

        <div className="mx-1 h-5 w-px" style={{ background: 'var(--border)' }} />

        {/* Method */}
        <FilterGroup
          options={methods as unknown as string[]}
          value={method}
          onChange={(v) => { setMethod(v); setPage(1) }}
          labels={{ ALL: t('requests.all') }}
        />

        <div className="mx-1 h-5 w-px" style={{ background: 'var(--border)' }} />

        {/* Status */}
        <FilterGroup
          options={statusGroups as unknown as string[]}
          value={statusGroup}
          onChange={(v) => { setStatusGroup(v); setPage(1) }}
          labels={{ ALL: t('requests.all') }}
        />

        {/* Search */}
        <div className="ms-auto">
          <input
            placeholder={t('requests.searchPath')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-48 border bg-[var(--bg-raised)] font-[inherit] outline-none"
            style={{
              height: 32,
              padding: '0 10px',
              borderRadius: 8,
              borderColor: 'var(--border-strong)',
              color: 'var(--text-primary)',
              fontSize: 13,
            }}
          />
        </div>
      </div>

      {/* Table + Detail */}
      <div className="animate-in stagger-3 flex gap-4">
        {/* Table */}
        <div className="flex-1 overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)' }}>
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <Th>{t('requests.directionCol')}</Th>
                <Th>{t('requests.methodCol')}</Th>
                <Th>{t('requests.pathCol')}</Th>
                <Th>{t('requests.statusCol')}</Th>
                <Th>{t('requests.durationCol')}</Th>
                <Th align="end">{t('requests.timeCol')}</Th>
              </tr>
            </thead>
            <tbody>
              {isLoading && Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-3 py-3"><SkeletonRow /></td></tr>
              ))}
              {!isLoading && requests.map((req) => (
                <tr
                  key={req.id}
                  onClick={() => setSelected(selected?.id === req.id ? null : req)}
                  className="cursor-pointer border-b transition-colors hover:bg-[var(--bg-hover)]"
                  style={{
                    borderColor: 'var(--border)',
                    background: selected?.id === req.id ? 'var(--bg-selected)' : undefined,
                  }}
                >
                  <td className="px-3 py-2.5">
                    <span className="flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                      {req.direction === 'inbound'
                        ? <ArrowDownLeft size={12} style={{ color: 'var(--info)' }} />
                        : <ArrowUpRight size={12} style={{ color: 'var(--primary-text)' }} />
                      }
                      {t(`requests.${req.direction}`)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className="inline-flex items-center justify-center rounded font-mono text-[11px] font-semibold"
                      style={{
                        height: 20,
                        padding: '0 6px',
                        background: 'var(--bg-active)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {req.method}
                    </span>
                  </td>
                  <td className="max-w-[300px] truncate px-3 py-2.5 font-mono text-[12px]" style={{ color: 'var(--text-primary)' }}>
                    {req.host}{req.path}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-[12px] font-medium" style={{ color: statusColor(req.statusCode) }}>
                      {req.statusCode}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-[12px]" style={{ color: durationColor(req.durationMs) }}>
                      {req.durationMs}ms
                    </span>
                    {req.isSlow && (
                      <span className="ms-1 inline-flex h-4 items-center rounded-full px-1.5 text-[9px] font-medium" style={{ background: 'var(--warning-ghost)', color: 'var(--warning-text)' }}>
                        {t('requests.slow')}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-end text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                    <TimeAgo date={req.timestamp} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && requests.length === 0 && (
            <div className="py-12 text-center text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
              {t('empty.noRequests')}
            </div>
          )}
          {/* Pagination */}
          {pagination && pagination.total > pagination.perPage && (
            <div className="flex items-center justify-between border-t px-3 py-2" style={{ borderColor: 'var(--border)' }}>
              <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                {((page - 1) * pagination.perPage + 1).toLocaleString()}–{Math.min(page * pagination.perPage, pagination.total).toLocaleString()} {t('requests.of')} {pagination.total.toLocaleString()}
              </span>
              <div className="flex gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="rounded px-2 py-0.5 text-[12px] font-medium transition-colors hover:bg-[var(--bg-hover)] disabled:opacity-30"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {t('requests.prev')}
                </button>
                <button
                  disabled={page * pagination.perPage >= pagination.total}
                  onClick={() => setPage(page + 1)}
                  className="rounded px-2 py-0.5 text-[12px] font-medium transition-colors hover:bg-[var(--bg-hover)] disabled:opacity-30"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {t('requests.next')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div
            className="animate-scale-in w-[340px] shrink-0 overflow-hidden rounded-xl border"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)' }}
          >
            <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
              <span className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                {selected.method} {selected.path}
              </span>
              <button
                onClick={() => setSelected(null)}
                className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-[var(--bg-hover)]"
                style={{ color: 'var(--text-tertiary)', fontSize: 14 }}
              >
                &times;
              </button>
            </div>
            <div className="space-y-3 p-4">
              <DetailRow label={t('requests.detail.status')} value={String(selected.statusCode)} color={statusColor(selected.statusCode)} />
              <DetailRow label={t('requests.detail.duration')} value={`${selected.durationMs}ms`} color={durationColor(selected.durationMs)} />
              <DetailRow label={t('requests.detail.direction')} value={t(`requests.${selected.direction}`)} />
              <DetailRow label={t('requests.detail.host')} value={selected.host} mono />
              <DetailRow label={t('requests.detail.path')} value={selected.path} mono />
              {selected.traceId && <DetailRow label={t('requests.detail.traceId')} value={selected.traceId} mono />}
              {selected.userId && <DetailRow label={t('requests.detail.userId')} value={selected.userId} mono />}
              {selected.errorFingerprint && <DetailRow label={t('requests.detail.error')} value={selected.errorFingerprint} mono />}
              <DetailRow label={t('requests.detail.timestamp')} value={new Date(selected.timestamp).toISOString()} mono />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ----- Sub-components ----- */

function Th({ children, align }: { children: React.ReactNode; align?: 'end' }) {
  return (
    <th
      className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider"
      style={{ color: 'var(--text-tertiary)', textAlign: align === 'end' ? 'end' : 'start' }}
    >
      {children}
    </th>
  )
}

function FilterGroup({
  options,
  value,
  onChange,
  labels,
}: {
  options: string[]
  value: string
  onChange: (v: string) => void
  labels?: Record<string, string>
}) {
  return (
    <div className="flex overflow-hidden rounded-md border" style={{ borderColor: 'var(--border-strong)' }}>
      {options.map((opt, i) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className="btn-press px-2.5 py-1 text-xs font-medium transition-colors"
          style={{
            background: value === opt ? 'var(--primary-ghost)' : 'transparent',
            color: value === opt ? 'var(--primary-text)' : 'var(--text-secondary)',
            borderInlineStart: i > 0 ? '1px solid var(--border-strong)' : undefined,
          }}
        >
          {labels?.[opt] ?? opt}
        </button>
      ))}
    </div>
  )
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color?: string }) {
  return (
    <div
      className="card-hover rounded-xl border p-3.5"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)', boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.03)' }}
    >
      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
        {icon} {label}
      </div>
      <div className="text-xl font-semibold tracking-tight" style={{ color: color ?? 'var(--text-primary)' }}>
        {value}
      </div>
    </div>
  )
}

function DetailRow({ label, value, mono, color }: { label: string; value: string; mono?: boolean; color?: string }) {
  return (
    <div>
      <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
        {label}
      </div>
      <div
        className={`text-[13px] ${mono ? 'font-mono' : ''} break-all`}
        style={{ color: color ?? 'var(--text-primary)' }}
      >
        {value}
      </div>
    </div>
  )
}
