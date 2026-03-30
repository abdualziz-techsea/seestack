import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { TimeAgo } from '@/components/shared/TimeAgo'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { Toggle } from '@/components/shared/Toggle'
import { useAuthStore } from '@/store/auth.store'
import { useFeatureFlags, useCreateFlag, useToggleFlag, useDeleteFlag } from '../hooks/useFeatureFlags'
import type { FeatureFlag } from '../hooks/useFeatureFlags'

export function FlagsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const currentProject = useAuthStore((s) => s.currentProject)
  const { flags, isLoading } = useFeatureFlags()
  const createMutation = useCreateFlag()
  const toggleMutation = useToggleFlag()
  const deleteMutation = useDeleteFlag()
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ key: '', name: '', description: '', type: 'boolean', defaultValue: 'false', rolloutPercent: 0 })

  const handleCreate = async () => {
    if (!currentProject || !form.key || !form.name) return
    try {
      await createMutation.mutateAsync({ projectId: currentProject.id, ...form, rules: null })
      setShowCreate(false)
      setForm({ key: '', name: '', description: '', type: 'boolean', defaultValue: 'false', rolloutPercent: 0 })
    } catch {}
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          {t('flags.title')}
        </h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium"
          style={{ background: 'var(--primary)', color: 'var(--bg-base)' }}
        >
          <Plus size={14} /> {t('flags.createFlag')}
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}>
          <div className="w-[460px] overflow-hidden rounded-2xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-strong)', boxShadow: 'var(--shadow-xl)' }}>
            <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                {t('flags.createFlag')}
              </h2>
            </div>
            <div className="space-y-3 p-5">
              <div>
                <label className="mb-1 block text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {t('flags.key')}
                </label>
                <input
                  value={form.key}
                  onChange={(e) => setForm({ ...form, key: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  placeholder="dark-mode-v2"
                  className="w-full border bg-[var(--bg-raised)] font-mono outline-none"
                  style={{ height: 36, padding: '0 12px', borderRadius: 8, borderColor: 'var(--border-strong)', color: 'var(--text-primary)', fontSize: 13 }}
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {t('flags.name')}
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Dark Mode V2"
                  className="w-full border bg-[var(--bg-raised)] outline-none"
                  style={{ height: 36, padding: '0 12px', borderRadius: 8, borderColor: 'var(--border-strong)', color: 'var(--text-primary)', fontSize: 14 }}
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {t('flags.rollout')}
                </label>
                <input
                  type="number"
                  value={form.rolloutPercent}
                  onChange={(e) => setForm({ ...form, rolloutPercent: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                  min={0} max={100}
                  className="w-full border bg-[var(--bg-raised)] outline-none"
                  style={{ height: 36, padding: '0 12px', borderRadius: 8, borderColor: 'var(--border-strong)', color: 'var(--text-primary)', fontSize: 14 }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t px-5 py-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)' }}>
              <button onClick={() => setShowCreate(false)} className="rounded-md px-3 py-1.5 text-[13px] font-medium" style={{ color: 'var(--text-secondary)', background: 'var(--bg-raised)', border: '1px solid var(--border-strong)' }}>
                {t('common.cancel')}
              </button>
              <button onClick={handleCreate} disabled={createMutation.isPending || !form.key || !form.name} className="rounded-md px-3 py-1.5 text-[13px] font-medium disabled:opacity-40" style={{ background: 'var(--primary)', color: '#fff' }}>
                {t('common.create')}
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
              <th className="w-12 px-4 py-2"></th>
              <th className="px-3 py-2 text-start text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                {t('flags.keyCol')}
              </th>
              <th className="px-3 py-2 text-start text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                {t('flags.nameCol')}
              </th>
              <th className="px-3 py-2 text-start text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                {t('flags.rolloutCol')}
              </th>
              <th className="px-3 py-2 text-end text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                {t('flags.updatedCol')}
              </th>
              <th className="w-16 px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 3 }).map((_, i) => (
              <tr key={i}><td colSpan={6} className="px-3 py-3"><SkeletonRow /></td></tr>
            ))}
            {!isLoading && flags.map((f: FeatureFlag) => (
              <tr key={f.id} className="border-b transition-colors hover:bg-[var(--bg-hover)]" style={{ borderColor: 'var(--border)', cursor: 'pointer' }} onClick={() => navigate(`/flags/${f.key}`)}>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <Toggle
                    checked={f.active}
                    onChange={() => currentProject && toggleMutation.mutate({ key: f.key, projectId: currentProject.id })}
                  />
                </td>
                <td className="px-3 py-3 font-mono text-[12px]" style={{ color: 'var(--primary-text)' }}>{f.key}</td>
                <td className="px-3 py-3 text-[13px]" style={{ color: 'var(--text-primary)' }}>{f.name}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full" style={{ background: 'var(--bg-elevated)' }}>
                      <div className="h-full rounded-full" style={{ width: `${f.rolloutPercent}%`, background: f.rolloutPercent > 0 ? 'var(--primary)' : 'transparent' }} />
                    </div>
                    <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>{f.rolloutPercent}%</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-end text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                  <TimeAgo date={f.updatedAt} />
                </td>
                <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => currentProject && deleteMutation.mutate({ key: f.key, projectId: currentProject.id })}
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
        {!isLoading && flags.length === 0 && (
          <div className="py-12 text-center text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
            {t('empty.noFlags')}
          </div>
        )}
      </div>
    </div>
  )
}
