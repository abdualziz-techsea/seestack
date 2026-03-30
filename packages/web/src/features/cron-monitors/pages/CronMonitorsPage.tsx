import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { TimeAgo } from '@/components/shared/TimeAgo'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { useAuthStore } from '@/store/auth.store'
import { useCronMonitors, useCreateCronMonitor, useDeleteCronMonitor } from '../hooks/useCronMonitors'
import type { CronMonitor } from '../hooks/useCronMonitors'

function statusIcon(status: string) {
  switch (status) {
    case 'ok': return <CheckCircle size={14} style={{ color: 'var(--success)' }} />
    case 'missed': return <AlertTriangle size={14} style={{ color: 'var(--warning)' }} />
    case 'failed': return <XCircle size={14} style={{ color: 'var(--danger)' }} />
    default: return <Clock size={14} style={{ color: 'var(--text-tertiary)' }} />
  }
}

function statusBadge(status: string) {
  const colors: Record<string, { bg: string; color: string }> = {
    ok: { bg: 'var(--success-ghost)', color: 'var(--success)' },
    missed: { bg: 'var(--warning-ghost)', color: 'var(--warning-text)' },
    failed: { bg: 'var(--danger-ghost)', color: 'var(--danger)' },
    pending: { bg: 'var(--bg-active)', color: 'var(--text-tertiary)' },
  }
  const c = colors[status] ?? colors.pending
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium"
      style={{ background: c.bg, color: c.color }}
    >
      {statusIcon(status)}
      {status}
    </span>
  )
}

export function CronMonitorsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const currentProject = useAuthStore((s) => s.currentProject)
  const { monitors, isLoading } = useCronMonitors()
  const createMutation = useCreateCronMonitor()
  const deleteMutation = useDeleteCronMonitor()
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', slug: '', schedule: '*/5 * * * *', gracePeriodMin: 5 })

  const handleCreate = async () => {
    if (!currentProject || !form.name || !form.slug) return
    try {
      await createMutation.mutateAsync({ projectId: currentProject.id, ...form })
      setShowCreate(false)
      setForm({ name: '', slug: '', schedule: '*/5 * * * *', gracePeriodMin: 5 })
    } catch {}
  }

  const handleDelete = (id: string) => {
    if (!currentProject) return
    deleteMutation.mutate({ id, projectId: currentProject.id })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          {t('cronMonitors.title', { defaultValue: 'Cron Monitors' })}
        </h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium"
          style={{ background: 'var(--primary)', color: 'var(--bg-base)' }}
        >
          <Plus size={14} /> {t('common.create', { defaultValue: 'Create' })}
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}>
          <div className="w-[460px] overflow-hidden rounded-2xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-strong)', boxShadow: 'var(--shadow-xl)' }}>
            <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                {t('cronMonitors.create', { defaultValue: 'Create cron monitor' })}
              </h2>
            </div>
            <div className="space-y-3 p-5">
              <div>
                <label className="mb-1 block text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {t('cronMonitors.name', { defaultValue: 'Name' })}
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Daily backup"
                  className="w-full border bg-[var(--bg-raised)] outline-none"
                  style={{ height: 36, padding: '0 12px', borderRadius: 8, borderColor: 'var(--border-strong)', color: 'var(--text-primary)', fontSize: 14 }}
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {t('cronMonitors.slug', { defaultValue: 'Slug' })}
                </label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  placeholder="daily-backup"
                  className="w-full border bg-[var(--bg-raised)] font-mono outline-none"
                  style={{ height: 36, padding: '0 12px', borderRadius: 8, borderColor: 'var(--border-strong)', color: 'var(--text-primary)', fontSize: 13 }}
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {t('cronMonitors.schedule', { defaultValue: 'Schedule (cron expression)' })}
                </label>
                <input
                  value={form.schedule}
                  onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                  placeholder="*/5 * * * *"
                  className="w-full border bg-[var(--bg-raised)] font-mono outline-none"
                  style={{ height: 36, padding: '0 12px', borderRadius: 8, borderColor: 'var(--border-strong)', color: 'var(--text-primary)', fontSize: 13 }}
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {t('cronMonitors.gracePeriod', { defaultValue: 'Grace period (minutes)' })}
                </label>
                <input
                  type="number"
                  value={form.gracePeriodMin}
                  onChange={(e) => setForm({ ...form, gracePeriodMin: parseInt(e.target.value) || 5 })}
                  min={1}
                  max={1440}
                  className="w-full border bg-[var(--bg-raised)] outline-none"
                  style={{ height: 36, padding: '0 12px', borderRadius: 8, borderColor: 'var(--border-strong)', color: 'var(--text-primary)', fontSize: 14 }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t px-5 py-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)' }}>
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-md px-3 py-1.5 text-[13px] font-medium"
                style={{ color: 'var(--text-secondary)', background: 'var(--bg-raised)', border: '1px solid var(--border-strong)' }}
              >
                {t('common.cancel', { defaultValue: 'Cancel' })}
              </button>
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending || !form.name || !form.slug}
                className="rounded-md px-3 py-1.5 text-[13px] font-medium disabled:opacity-40"
                style={{ background: 'var(--primary)', color: '#fff' }}
              >
                {createMutation.isPending ? t('common.creating', { defaultValue: 'Creating...' }) : t('common.create', { defaultValue: 'Create' })}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)' }}>
        <table className="w-full">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
              <th className="px-3 py-2 text-start text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                {t('cronMonitors.nameCol', { defaultValue: 'Name' })}
              </th>
              <th className="px-3 py-2 text-start text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                {t('cronMonitors.slugCol', { defaultValue: 'Slug' })}
              </th>
              <th className="px-3 py-2 text-start text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                {t('cronMonitors.scheduleCol', { defaultValue: 'Schedule' })}
              </th>
              <th className="px-3 py-2 text-start text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                {t('cronMonitors.statusCol', { defaultValue: 'Status' })}
              </th>
              <th className="px-3 py-2 text-end text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                {t('cronMonitors.lastPing', { defaultValue: 'Last Ping' })}
              </th>
              <th className="w-16 px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 3 }).map((_, i) => (
              <tr key={i}><td colSpan={6} className="px-3 py-3"><SkeletonRow /></td></tr>
            ))}
            {!isLoading && monitors.map((m: CronMonitor) => (
              <tr key={m.id} className="border-b transition-colors hover:bg-[var(--bg-hover)]" style={{ borderColor: 'var(--border)', cursor: 'pointer' }} onClick={() => navigate(`/cron-monitors/${m.id}`)}>
                <td className="px-3 py-3 text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{m.name}</td>
                <td className="px-3 py-3 font-mono text-[12px]" style={{ color: 'var(--text-secondary)' }}>{m.slug}</td>
                <td className="px-3 py-3 font-mono text-[12px]" style={{ color: 'var(--text-secondary)' }}>{m.schedule}</td>
                <td className="px-3 py-3">{statusBadge(m.currentStatus)}</td>
                <td className="px-3 py-3 text-end text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                  {m.lastPingAt ? <TimeAgo date={m.lastPingAt} /> : '—'}
                </td>
                <td className="px-3 py-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(m.id) }}
                    className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-[var(--bg-hover)]"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && monitors.length === 0 && (
          <div className="py-12 text-center text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
            {t('empty.noCronMonitors', { defaultValue: 'No cron monitors configured' })}
          </div>
        )}
      </div>
    </div>
  )
}
