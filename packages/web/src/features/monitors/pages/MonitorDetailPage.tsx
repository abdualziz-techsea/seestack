import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Pause, Play, Trash2, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react'
import { TimeAgo } from '@/components/shared/TimeAgo'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { useMonitorDetail, useMonitorChecks, usePauseResumeMonitor, useDeleteMonitorById, numericStatusToString } from '../hooks/useMonitorDetail'

type Tab = 'overview' | 'checks'

function statusBadge(status: string) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    up: { bg: 'var(--success-ghost)', color: 'var(--success)', label: 'Operational' },
    down: { bg: 'var(--danger-ghost)', color: 'var(--danger)', label: 'Down' },
    degraded: { bg: 'var(--warning-ghost)', color: 'var(--warning-text)', label: 'Degraded' },
    paused: { bg: 'var(--bg-active)', color: 'var(--text-tertiary)', label: 'Paused' },
    pending: { bg: 'var(--bg-active)', color: 'var(--text-tertiary)', label: 'Pending' },
  }
  const c = map[status] ?? map.pending
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium"
      style={{ background: c.bg, color: c.color }}
    >
      {c.label}
    </span>
  )
}

function checkStatusIcon(status: string) {
  switch (status) {
    case 'up': return <CheckCircle size={14} style={{ color: 'var(--success)' }} />
    case 'down': return <XCircle size={14} style={{ color: 'var(--danger)' }} />
    case 'degraded': return <AlertTriangle size={14} style={{ color: 'var(--warning-text)' }} />
    default: return <Clock size={14} style={{ color: 'var(--text-tertiary)' }} />
  }
}

export function MonitorDetailPage() {
  const { monitorId } = useParams<{ monitorId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('overview')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const { monitor, isLoading } = useMonitorDetail(monitorId!)
  const { checks, uptimePercentage, totalChecks, avgResponseTimeMs, isLoading: checksLoading } = useMonitorChecks(monitorId!)
  const pauseResumeMutation = usePauseResumeMonitor()
  const deleteMutation = useDeleteMonitorById()

  const handleTogglePause = () => {
    if (!monitor) return
    pauseResumeMutation.mutate({
      id: monitor.id,
      name: monitor.name,
      url: monitor.url,
      intervalMinutes: monitor.intervalMinutes,
      isActive: !monitor.isActive,
    })
  }

  const handleDelete = async () => {
    if (!monitor) return
    await deleteMutation.mutateAsync(monitor.id)
    navigate('/monitors')
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: t('monitors.overview', { defaultValue: 'Overview' }) },
    { id: 'checks', label: t('monitors.checks', { defaultValue: 'Check History' }) },
  ]

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 animate-pulse rounded-lg" style={{ background: 'var(--bg-elevated)' }} />
        <div className="h-24 animate-pulse rounded-xl" style={{ background: 'var(--bg-elevated)' }} />
        <div className="h-64 animate-pulse rounded-xl" style={{ background: 'var(--bg-elevated)' }} />
      </div>
    )
  }

  if (!monitor) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
          {t('monitors.notFound', { defaultValue: 'Monitor not found' })}
        </p>
        <button
          onClick={() => navigate('/monitors')}
          className="mt-4 rounded-lg px-4 py-2 text-[13px] font-medium"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
        >
          {t('monitors.backToMonitors', { defaultValue: '← Back to monitors' })}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Back + Header */}
      <div>
        <button
          onClick={() => navigate('/monitors')}
          className="mb-3 flex items-center gap-1.5 text-[12px] font-medium transition-colors hover:opacity-70"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <ArrowLeft size={13} />
          {t('monitors.title', { defaultValue: 'Monitors' })}
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-[18px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {monitor.name}
                </h1>
                {statusBadge(
                  !monitor.isActive ? 'paused'
                    : checks.length > 0 ? numericStatusToString(checks[0].status)
                    : 'pending'
                )}
              </div>
              <p className="mt-0.5 text-[12px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                {monitor.url}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleTogglePause}
              disabled={pauseResumeMutation.isPending}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors disabled:opacity-50"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-raised)' }}
            >
              {monitor.isActive ? <Pause size={13} /> : <Play size={13} />}
              {monitor.isActive
                ? t('monitors.pauseAction', { defaultValue: 'Pause' })
                : t('monitors.resumeAction', { defaultValue: 'Resume' })}
            </button>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors"
              style={{ borderColor: 'var(--danger-border, var(--danger))', color: 'var(--danger)', background: 'var(--danger-ghost)' }}
            >
              <Trash2 size={13} />
              {t('monitors.deleteAction', { defaultValue: 'Delete' })}
            </button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: t('monitors.uptime', { defaultValue: 'Uptime' }), value: `${(uptimePercentage ?? 0).toFixed(2)}%`, color: 'var(--success)' },
          { label: t('monitors.responseTime', { defaultValue: 'Avg Response' }), value: avgResponseTimeMs ? `${avgResponseTimeMs}ms` : '—', color: 'var(--text-primary)' },
          { label: t('monitors.totalChecks', { defaultValue: 'Total Checks' }), value: (totalChecks ?? 0).toLocaleString(), color: 'var(--text-primary)' },
          { label: t('monitors.checkInterval', { defaultValue: 'Interval' }), value: `${monitor.intervalMinutes}m`, color: 'var(--text-primary)' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-xl border p-4"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)' }}
          >
            <div className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
              {label}
            </div>
            <div className="mt-1.5 text-[22px] font-semibold tabular-nums" style={{ color }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: 'var(--border)' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2 text-[13px] font-medium transition-colors"
            style={{
              color: tab === t.id ? 'var(--primary-text)' : 'var(--text-secondary)',
              borderBottom: tab === t.id ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="space-y-4">
          {/* Mini uptime bar — last 24 checks colored */}
          {checks.length > 0 && (
            <div
              className="rounded-xl border p-5"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)' }}
            >
              <div className="mb-3 text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                {t('monitors.recentChecks', { defaultValue: 'Recent checks (last 24h)' })}
              </div>
              <div className="flex items-end gap-0.5" style={{ height: 32 }}>
                {[...checks].slice(0, 60).map((c, i) => {
                  const strStatus = numericStatusToString(c.status)
                  const color = strStatus === 'up' ? 'var(--success)' : strStatus === 'down' ? 'var(--danger)' : 'var(--warning)'
                  const barH = strStatus === 'up' ? '60%' : '100%'
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-sm transition-all"
                      style={{ background: color, minWidth: 4, height: barH }}
                      title={`${strStatus} — ${c.responseTimeMs}ms`}
                    />
                  )
                })}
              </div>
            </div>
          )}
          {/* URL info */}
          <div
            className="rounded-xl border p-5"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)' }}
          >
            <div className="space-y-3 text-[13px]">
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>URL</span>
                <a
                  href={monitor.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono hover:underline"
                  style={{ color: 'var(--primary-text)' }}
                >
                  {monitor.url}
                </a>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>{t('monitors.checkInterval', { defaultValue: 'Interval' })}</span>
                <span style={{ color: 'var(--text-primary)' }}>
                  {t('monitors.everyInterval', { value: monitor.intervalMinutes, defaultValue: `Every ${monitor.intervalMinutes} min` })}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>{t('common.active', { defaultValue: 'Status' })}</span>
                <span style={{ color: 'var(--text-primary)' }}>
                  {monitor.isActive ? t('common.active', { defaultValue: 'Active' }) : t('common.paused', { defaultValue: 'Paused' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'checks' && (
        <div
          className="overflow-hidden rounded-xl border"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)' }}
        >
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <th className="px-4 py-2.5 text-start text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                  {t('monitors.checkStatusCol', { defaultValue: 'Status' })}
                </th>
                <th className="px-4 py-2.5 text-start text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                  {t('monitors.checkTime', { defaultValue: 'Time' })}
                </th>
                <th className="px-4 py-2.5 text-start text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                  {t('monitors.checkResponseTime', { defaultValue: 'Response' })}
                </th>
                <th className="px-4 py-2.5 text-start text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                  {t('monitors.checkStatusCode', { defaultValue: 'Code' })}
                </th>
                <th className="px-4 py-2.5 text-start text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                  {t('monitors.checkMessage', { defaultValue: 'Message' })}
                </th>
              </tr>
            </thead>
            <tbody>
              {checksLoading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={5} className="px-4 py-3"><SkeletonRow /></td></tr>
              ))}
              {!checksLoading && checks.map((c, i) => {
                const strStatus = numericStatusToString(c.status)
                return (
                  <tr key={i} className="border-b transition-colors hover:bg-[var(--bg-hover)]" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {checkStatusIcon(strStatus)}
                        <span className="text-[12px] capitalize" style={{ color: 'var(--text-primary)' }}>{strStatus}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                      <TimeAgo date={c.timestamp} />
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-[12px]" style={{ color: 'var(--text-primary)' }}>
                      {c.responseTimeMs != null ? `${c.responseTimeMs}ms` : '—'}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-[12px]" style={{ color: c.statusCode && c.statusCode >= 400 ? 'var(--danger)' : 'var(--text-secondary)' }}>
                      {c.statusCode ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-[12px]" style={{ color: 'var(--text-tertiary)', maxWidth: 200 }}>
                      <span className="truncate block">{c.error ?? '—'}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!checksLoading && checks.length === 0 && (
            <div className="py-12 text-center text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
              {t('monitors.noChecks', { defaultValue: 'No check history yet' })}
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation dialog */}
      {showDeleteDialog && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setShowDeleteDialog(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border p-6 shadow-2xl" style={{ background: 'var(--bg-overlay)', borderColor: 'var(--border)' }}>
            <h3 className="text-[15px] font-semibold" style={{ color: 'var(--danger)' }}>
              {t('monitors.deleteAction', { defaultValue: 'Delete monitor' })}?
            </h3>
            <p className="mt-2 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              {t('monitors.deleteConfirm', { defaultValue: 'This monitor and all its check history will be permanently deleted.' })}
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1 rounded-lg border py-2 text-[13px] font-medium"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                {t('common.cancel', { defaultValue: 'Cancel' })}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 rounded-lg py-2 text-[13px] font-medium disabled:opacity-40"
                style={{ background: 'var(--danger)', color: 'white' }}
              >
                {deleteMutation.isPending
                  ? t('common.loading', { defaultValue: 'Deleting...' })
                  : t('common.delete', { defaultValue: 'Delete' })}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
