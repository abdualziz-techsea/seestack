import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { Toggle } from '@/components/shared/Toggle'
import { TimeAgo } from '@/components/shared/TimeAgo'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { useFlagDetail, useFlagAudit } from '../hooks/useFlagDetail'
import { useToggleFlag, useDeleteFlag } from '../hooks/useFeatureFlags'
import { useAuthStore } from '@/store/auth.store'
import type { FlagAuditEvent } from '../hooks/useFlagDetail'

type Tab = 'overview' | 'audit'

export function FlagDetailPage() {
  const { flagId } = useParams<{ flagId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('overview')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const currentProject = useAuthStore((s) => s.currentProject)

  const { flag, isLoading, refetch } = useFlagDetail(flagId!)
  const { events, isLoading: auditLoading } = useFlagAudit(flagId!)
  const toggleMutation = useToggleFlag()
  const deleteMutation = useDeleteFlag()

  const handleToggle = () => {
    if (!flag || !currentProject) return
    toggleMutation.mutate(
      { key: flag.key, projectId: currentProject.id },
      { onSuccess: () => refetch() }
    )
  }

  const handleDelete = async () => {
    if (!flag || !currentProject) return
    await deleteMutation.mutateAsync({ key: flag.key, projectId: currentProject.id })
    navigate('/flags')
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: t('flags.overview', { defaultValue: 'Overview' }) },
    { id: 'audit', label: t('flags.auditLog', { defaultValue: 'Audit Log' }) },
  ]

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 animate-pulse rounded-lg" style={{ background: 'var(--bg-elevated)' }} />
        <div className="h-20 animate-pulse rounded-xl" style={{ background: 'var(--bg-elevated)' }} />
        <div className="h-48 animate-pulse rounded-xl" style={{ background: 'var(--bg-elevated)' }} />
      </div>
    )
  }

  if (!flag) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
          {t('flags.notFound', { defaultValue: 'Flag not found' })}
        </p>
        <button
          onClick={() => navigate('/flags')}
          className="mt-4 rounded-lg px-4 py-2 text-[13px] font-medium"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
        >
          ← {t('flags.title', { defaultValue: 'Feature Flags' })}
        </button>
      </div>
    )
  }

  const isActive = flag.active ?? flag.isActive ?? false

  return (
    <div className="space-y-5">
      {/* Back + Header */}
      <div>
        <button
          onClick={() => navigate('/flags')}
          className="mb-3 flex items-center gap-1.5 text-[12px] font-medium transition-colors hover:opacity-70"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <ArrowLeft size={13} />
          {t('flags.title', { defaultValue: 'Feature Flags' })}
        </button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[18px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                {flag.name}
              </h1>
              <Toggle
                checked={isActive}
                onChange={handleToggle}
                disabled={toggleMutation.isPending}
              />
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="font-mono text-[12px]" style={{ color: 'var(--primary-text)' }}>{flag.key}</span>
              <span className="rounded px-1.5 py-0.5 text-[10px] font-medium capitalize" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                {flag.type}
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium"
            style={{ borderColor: 'var(--danger-border, var(--danger))', color: 'var(--danger)', background: 'var(--danger-ghost)' }}
          >
            <Trash2 size={13} />
            {t('common.delete', { defaultValue: 'Delete' })}
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: t('flags.rolloutCol', { defaultValue: 'Rollout' }), value: `${flag.rolloutPercent ?? 0}%` },
          { label: t('flags.flagType', { defaultValue: 'Type' }), value: flag.type ?? '—' },
          { label: t('flags.defaultValueLabel', { defaultValue: 'Default' }), value: String(flag.defaultValue ?? '—') },
          { label: t('flags.updatedCol', { defaultValue: 'Updated' }), value: <TimeAgo date={flag.updatedAt} /> },
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

      {/* Rollout bar */}
      <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)' }}>
        <div className="mb-2 flex items-center justify-between text-[12px]">
          <span style={{ color: 'var(--text-secondary)' }}>{t('flags.rolloutCol', { defaultValue: 'Rollout' })}</span>
          <span className="font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>{flag.rolloutPercent ?? 0}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--bg-elevated)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${flag.rolloutPercent ?? 0}%`, background: 'var(--primary)' }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: 'var(--border)' }}>
        {tabs.map((tObj) => (
          <button
            key={tObj.id}
            onClick={() => setTab(tObj.id)}
            className="px-4 py-2 text-[13px] font-medium transition-colors"
            style={{
              color: tab === tObj.id ? 'var(--primary-text)' : 'var(--text-secondary)',
              borderBottom: tab === tObj.id ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {tObj.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <div className="space-y-4">
          {flag.description && (
            <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)' }}>
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                {t('flags.description', { defaultValue: 'Description' })}
              </div>
              <p className="text-[13px]" style={{ color: 'var(--text-primary)' }}>{flag.description}</p>
            </div>
          )}
          <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)' }}>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
              {t('flags.rules', { defaultValue: 'Targeting Rules' })}
            </div>
            {flag.rules && flag.rules !== 'null' && !(Array.isArray(flag.rules) && flag.rules.length === 0) ? (
              <pre className="overflow-auto rounded-lg p-3 text-[12px] font-mono" style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', maxHeight: 240 }}>
                {typeof flag.rules === 'string'
                  ? flag.rules
                  : JSON.stringify(flag.rules, null, 2)}
              </pre>
            ) : (
              <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                {t('flags.noRules', { defaultValue: 'No targeting rules configured. All users receive the default value.' })}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Audit log tab */}
      {tab === 'audit' && (
        <div
          className="overflow-hidden rounded-xl border"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)' }}
        >
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <th className="px-4 py-2.5 text-start text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                  {t('flags.auditAction', { defaultValue: 'Action' })}
                </th>
                <th className="px-4 py-2.5 text-start text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                  {t('flags.auditTime', { defaultValue: 'Time' })}
                </th>
                <th className="px-4 py-2.5 text-start text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                  {t('flags.auditUser', { defaultValue: 'User' })}
                </th>
                <th className="px-4 py-2.5 text-start text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                  {t('flags.auditDetails', { defaultValue: 'Details' })}
                </th>
              </tr>
            </thead>
            <tbody>
              {auditLoading && Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}><td colSpan={4} className="px-4 py-3"><SkeletonRow /></td></tr>
              ))}
              {!auditLoading && events.map((e: FlagAuditEvent, i) => (
                <tr key={e.id ?? i} className="border-b transition-colors hover:bg-[var(--bg-hover)]" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-2.5">
                    <span
                      className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium capitalize"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                    >
                      {e.action}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                    <TimeAgo date={e.createdAt} />
                  </td>
                  <td className="px-4 py-2.5 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                    {e.userEmail ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 text-[12px]" style={{ color: 'var(--text-tertiary)', maxWidth: 220 }}>
                    <span className="block truncate">{e.details ?? '—'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!auditLoading && events.length === 0 && (
            <div className="py-12 text-center text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
              {t('flags.noAudit', { defaultValue: 'No audit events yet' })}
            </div>
          )}
        </div>
      )}

      {/* Delete dialog */}
      {showDeleteDialog && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setShowDeleteDialog(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border p-6 shadow-2xl" style={{ background: 'var(--bg-overlay)', borderColor: 'var(--border)' }}>
            <h3 className="text-[15px] font-semibold" style={{ color: 'var(--danger)' }}>
              {t('common.delete', { defaultValue: 'Delete' })} "{flag.name}"?
            </h3>
            <p className="mt-2 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              {t('flags.deleteConfirm', { defaultValue: 'This flag will be permanently deleted and all targeting rules removed.' })}
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
