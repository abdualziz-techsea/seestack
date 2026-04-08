import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TimeAgo } from '@/components/shared/TimeAgo'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { useErrors } from '../../errors/hooks/useErrors'
import type { ErrorGroup } from '@seestack/shared'

export function RecentErrorsList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { errors, isLoading } = useErrors({ perPage: 5 })

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {t('overview.recentErrors', { defaultValue: 'Recent Errors' })}
        </span>
        <button onClick={() => navigate('/errors')} className="text-xs font-medium hover:underline" style={{ color: 'var(--primary-text)' }}>
          {t('common.viewAll')} →
        </button>
      </div>
      <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)' }}>
        {isLoading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border-b px-3.5 py-2.5" style={{ borderColor: 'var(--border)' }}><SkeletonRow /></div>
        ))}
        {errors.map((err: ErrorGroup) => (
          <div
            key={err.id}
            onClick={() => navigate('/errors')}
            className="flex cursor-pointer items-center gap-2.5 border-b px-3.5 py-2.5 transition-colors last:border-b-0 hover:bg-[var(--bg-hover)]"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{err.exceptionClass}</div>
              <div className="truncate font-mono text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{err.message}</div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <StatusBadge status={err.status} />
              <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{err.occurrences}×</span>
              <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}><TimeAgo date={err.lastSeen} /></span>
            </div>
          </div>
        ))}
        {!isLoading && errors.length === 0 && (
          <div className="py-6 text-center text-[13px]" style={{ color: 'var(--text-tertiary)' }}>{t('empty.noRecentErrors')}</div>
        )}
      </div>
    </div>
  )
}
