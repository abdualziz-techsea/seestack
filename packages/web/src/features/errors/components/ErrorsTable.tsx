import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LevelBadge } from '@/components/shared/LevelBadge'
import { TimeAgo } from '@/components/shared/TimeAgo'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { useErrors } from '../hooks/useErrors'
import type { ErrorGroup } from '@allstak/shared'

interface ErrorsTableProps {
  statusFilter: string
  envFilter: string
  search: string
  onSelect: (fingerprint: string) => void
}

export function ErrorsTable({ statusFilter, envFilter, search, onSelect }: ErrorsTableProps) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const { errors, isLoading } = useErrors({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    environment: envFilter !== 'all' ? envFilter : undefined,
  })

  const filtered = errors.filter((e: ErrorGroup) => {
    if (search && !e.exceptionClass.toLowerCase().includes(search.toLowerCase()) && !e.message.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const toggleSelect = (fp: string) => {
    const next = new Set(selected)
    next.has(fp) ? next.delete(fp) : next.add(fp)
    setSelected(next)
  }

  return (
    <div className="overflow-hidden border" style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)', borderRadius: 'var(--radius-xl)' }}>
      <table className="w-full">
        <thead>
          <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
            <th className="w-8 px-3 py-1.5"><input type="checkbox" className="rounded" /></th>
            <th className="px-3 py-1.5 text-start text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Error</th>
            <th className="px-3 py-1.5 text-start text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Status</th>
            <th className="px-3 py-1.5 text-start text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{t('common.environment')}</th>
            <th className="px-3 py-1.5 text-end text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{t('common.occurrences')}</th>
            <th className="px-3 py-1.5 text-end text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{t('common.lastSeen')}</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && Array.from({ length: 5 }).map((_, i) => (
            <tr key={i}><td colSpan={6} className="px-3 py-2"><SkeletonRow /></td></tr>
          ))}
          {filtered.map((err: ErrorGroup) => (
            <tr
              key={err.fingerprint}
              onClick={() => onSelect(err.fingerprint)}
              className="cursor-pointer border-b transition-colors hover:bg-[var(--bg-hover)]"
              style={{ borderColor: 'var(--border)' }}
            >
              <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" checked={selected.has(err.fingerprint)} onChange={() => toggleSelect(err.fingerprint)} className="rounded" />
              </td>
              <td className="px-3 py-2">
                <div className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{err.exceptionClass}</div>
                <div className="truncate text-[12px]" style={{ color: 'var(--text-secondary)', maxWidth: 400 }}>{err.message}</div>
              </td>
              <td className="px-3 py-2"><StatusBadge status={err.status} /></td>
              <td className="px-3 py-2"><LevelBadge level={err.level} /></td>
              <td className="px-3 py-2 text-end text-[13px] font-mono" style={{ color: 'var(--text-primary)' }}>{err.occurrences}</td>
              <td className="px-3 py-2 text-end text-[12px]"><TimeAgo date={err.lastSeen} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      {!isLoading && filtered.length === 0 && (
        <div className="py-12 text-center text-[13px]" style={{ color: 'var(--text-tertiary)' }}>{t('empty.noErrors')}</div>
      )}

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div
          className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-xl border px-4 py-2 shadow-lg"
          style={{ background: 'var(--bg-overlay)', borderColor: 'var(--border)' }}
        >
          <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{selected.size} selected</span>
          <button className="rounded-md px-3 py-1 text-[12px] font-medium" style={{ background: 'var(--success-ghost)', color: 'var(--success)' }}>
            {t('errors.resolve')}
          </button>
          <button className="rounded-md px-3 py-1 text-[12px] font-medium" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
            {t('errors.ignore')}
          </button>
        </div>
      )}
    </div>
  )
}
