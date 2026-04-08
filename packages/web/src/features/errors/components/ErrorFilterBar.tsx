import { useTranslation } from 'react-i18next'
import { cn } from '@seestack/shared'
import { Search } from 'lucide-react'

interface ErrorFilterBarProps {
  statusFilter: string
  envFilter: string
  search: string
  onStatusChange: (s: string) => void
  onEnvChange: (e: string) => void
  onSearchChange: (q: string) => void
}

const statuses = ['all', 'unresolved', 'resolved', 'ignored']
const envs = ['all', 'production', 'staging', 'development']

export function ErrorFilterBar({ statusFilter, envFilter, search, onStatusChange, onEnvChange, onSearchChange }: ErrorFilterBarProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex gap-1 rounded-lg border p-0.5" style={{ borderColor: 'var(--border)' }}>
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => onStatusChange(s)}
            className="rounded-md px-3 py-1 text-[12px] font-medium transition-colors"
            style={{
              background: statusFilter === s ? 'var(--primary-ghost)' : 'transparent',
              color: statusFilter === s ? 'var(--primary-text)' : 'var(--text-tertiary)',
            }}
          >
            {s === 'all' ? 'All' : t(`errors.${s}`, { defaultValue: s })}
          </button>
        ))}
      </div>
      <select
        value={envFilter}
        onChange={(e) => onEnvChange(e.target.value)}
        className="rounded-lg border px-3 py-1.5 text-[12px] outline-none"
        style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
      >
        {envs.map((e) => (
          <option key={e} value={e}>{e === 'all' ? t('common.environment') : t(`common.${e}`, { defaultValue: e })}</option>
        ))}
      </select>
      <div className="flex flex-1 items-center gap-2 rounded-lg border px-3 py-1.5" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
        <Search size={14} style={{ color: 'var(--text-tertiary)' }} />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('common.search', { defaultValue: 'Search' }) + '...'}
          className="flex-1 bg-transparent text-[13px] outline-none"
          style={{ color: 'var(--text-primary)' }}
        />
      </div>
    </div>
  )
}
