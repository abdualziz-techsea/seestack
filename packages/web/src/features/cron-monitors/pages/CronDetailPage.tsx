import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Trash2, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react'
import { Toggle } from '@/components/shared/Toggle'
import { TimeAgo } from '@/components/shared/TimeAgo'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { useCronDetail, useCronHistory, useToggleCronMonitor } from '../hooks/useCronDetail'
import { useDeleteCronMonitor } from '../hooks/useCronMonitors'
import { useAuthStore } from '@/store/auth.store'
import type { CronExecution } from '../hooks/useCronDetail'

function statusBadge(status: string) {
  const map: Record<string, { bg: string; color: string }> = {
    ok: { bg: 'var(--success-ghost)', color: 'var(--success)' },
    missed: { bg: 'var(--warning-ghost)', color: 'var(--warning-text)' },
    failed: { bg: 'var(--danger-ghost)', color: 'var(--danger)' },
    pending: { bg: 'var(--bg-active)', color: 'var(--text-tertiary)' },
  }
  const c = map[status] ?? map.pending
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize"
      style={{ background: c.bg, color: c.color }}
    >
      {status}
    </span>
  )
}

function execStatusIcon(status: string) {
  switch (status) {
    case 'ok': return <CheckCircle size={14} style={{ color: 'var(--success)' }} />
    case 'failed': return <XCircle size={14} style={{ color: 'var(--danger)' }} />
    case 'missed': return <AlertTriangle size={14} style={{ color: 'var(--warning-text)' }} />
    default: return <Clock size={14} style={{ color: 'var(--text-tertiary)' }} />
  }
}

export function CronDetailPage() {
  const { cronId } = useParams<{ cronId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const currentProject = useAuthStore((s) => s.currentProject)
  const { cron, isLoading } = useCronDetail(cronId!)
  const { history, isLoading: histLoading } = useCronHistory(cronId!)
  const toggleMutation = useToggleCronMonitor()
  const deleteMutation = useDeleteCronMonitor()

  const handleToggle = () => {
    if (!cron) return
    toggleMutation.mutate({ id: cron.id, isActive: !cron.isActive })
  }

  const handleDelete = async () => {
    if (!cron || !currentProject) return
    await deleteMutation.mutateAsync({ id: cron.id, projectId: currentProject.id })
    navigate('/cron-monitors')
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 animate-pulse rounded-lg" style={{ background: 'var(--bg-elevated)' }} />
        <div className="h-24 animate-pulse rounded-xl" style={{ background: 'var(--bg-elevated)' }} />
        <div className="h-64 animate-pulse rounded-xl" style={{ background: 'var(--bg-elevated)' }} />
      </div>
    )
  }

  if (!cron) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
          {t('cronMonitors.notFound', { defaultValue: 'Cron monitor not found' })}
        </p>
        <button
          onClick={() => navigate('/cron-monitors')}
          className="mt-4 rounded-lg px-4 py-2 text-[13px] font-medium"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
        >
          ← {t('cronMonitors.title', { defaultValue: 'Cron Monitors' })}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Back + Header */}
      <div>
        <button
          onClick={() => navigate('/cron-monitors')}
          className="mb-3 flex items-center gap-1.5 text-[12px] font-medium transition-colors hover:opacity-70"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <ArrowLeft size={13} />
          {t('cronMonitors.title', { defaultValue: 'Cron Monitors' })}
        </button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-[18px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                {cron.name}
              </h1>
              {statusBadge(cron.currentStatus)}
            </div>
            <div className="mt-0.5 flex items-center gap-3">
              <span className="font-mono text-[12px]" style={{ color: 'var(--text-tertiary)' }}>{cron.slug}</span>
              <span className="font-mono text-[12px]" style={{ color: 'var(--text-secondary)' }}>{cron.schedule}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                {cron.isActive
                  ? t('common.active', { defaultValue: 'Active' })
                  : t('common.paused', { defaultValue: 'Paused' })}
              </span>
              <Toggle
                checked={cron.isActive}
                onChange={handleToggle}
                disabled={toggleMutation.isPending}
              />
            </div>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium"
              style={{ borderColor: 'var(--danger-border, var(--danger))', color: 'var(--danger)', background: 'var(--danger-ghost)' }}
            >
              <Trash2 size={13} />
              {t('common.delete', { defaultValue: 'Delete' })}
            </button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: t('cronMonitors.lastPing', { defaultValue: 'Last ping' }),
            value: cron.lastPingAt ? <TimeAgo date={cron.lastPingAt} /> : '—',
          },
          {
            label: t('cronMonitors.nextExpected', { defaultValue: 'Next expected' }),
            value: cron.nextExpectedAt ? <TimeAgo date={cron.nextExpectedAt} /> : '—',
          },
          {
            label: t('cronMonitors.lastDuration', { defaultValue: 'Last duration' }),
            value: cron.lastDurationMs != null ? `${cron.lastDurationMs}ms` : '—',
          },
          {
            label: t('cronMonitors.gracePeriod', { defaultValue: 'Grace period' }),
            value: `${cron.gracePeriodMin}m`,
          },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border p-4"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)' }}
          >
            <div className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
              {label}
            </div>
            <div className="mt-1.5 text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Last message */}
      {cron.lastMessage && (
        <div
          className="rounded-xl border px-4 py-3 text-[12px] font-mono"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)', color: 'var(--text-secondary)' }}
        >
          {cron.lastMessage}
        </div>
      )}

      {/* Execution history */}
      <div>
        <h2 className="mb-3 text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          {t('cronMonitors.history', { defaultValue: 'Execution History' })}
        </h2>
        <div
          className="overflow-hidden rounded-xl border"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)' }}
        >
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <th className="px-4 py-2.5 text-start text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                  {t('cronMonitors.historyStatus', { defaultValue: 'Status' })}
                </th>
                <th className="px-4 py-2.5 text-start text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                  {t('cronMonitors.historyTime', { defaultValue: 'Time' })}
                </th>
                <th className="px-4 py-2.5 text-start text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                  {t('cronMonitors.historyDuration', { defaultValue: 'Duration' })}
                </th>
                <th className="px-4 py-2.5 text-start text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                  {t('cronMonitors.historyMessage', { defaultValue: 'Message' })}
                </th>
              </tr>
            </thead>
            <tbody>
              {histLoading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={4} className="px-4 py-3"><SkeletonRow /></td></tr>
              ))}
              {!histLoading && history.map((h: CronExecution, i) => (
                <tr key={h.id ?? i} className="border-b transition-colors hover:bg-[var(--bg-hover)]" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      {execStatusIcon(h.status)}
                      <span className="text-[12px] capitalize" style={{ color: 'var(--text-primary)' }}>{h.status}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                    <TimeAgo date={h.executedAt} />
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-[12px]" style={{ color: 'var(--text-primary)' }}>
                    {h.durationMs != null ? `${h.durationMs}ms` : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-[12px]" style={{ color: 'var(--text-tertiary)', maxWidth: 260 }}>
                    <span className="block truncate">{h.message ?? '—'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!histLoading && history.length === 0 && (
            <div className="py-12 text-center text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
              {t('cronMonitors.noHistory', { defaultValue: 'No execution history yet' })}
            </div>
          )}
        </div>
      </div>

      {/* Delete dialog */}
      {showDeleteDialog && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setShowDeleteDialog(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border p-6 shadow-2xl" style={{ background: 'var(--bg-overlay)', borderColor: 'var(--border)' }}>
            <h3 className="text-[15px] font-semibold" style={{ color: 'var(--danger)' }}>
              {t('common.delete', { defaultValue: 'Delete' })} "{cron.name}"?
            </h3>
            <p className="mt-2 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              {t('cronMonitors.deleteConfirm', { defaultValue: 'This cron monitor and all execution history will be permanently deleted.' })}
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
                {t('common.delete', { defaultValue: 'Delete' })}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
