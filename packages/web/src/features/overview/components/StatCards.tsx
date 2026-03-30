import { useTranslation } from 'react-i18next'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { useOverviewData } from '../hooks/useOverviewData'

export function StatCards() {
  const { t } = useTranslation()
  const { data, isLoading } = useOverviewData()

  const stats = data?.stats ?? [
    { labelKey: 'overview.totalErrors', value: 0 },
    { labelKey: 'overview.newErrors', value: 0 },
    { labelKey: 'overview.monitorsUp', value: 0 },
    { labelKey: 'overview.sshSessions', value: 0 },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {isLoading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)' }}>
            <SkeletonRow />
          </div>
        ))
      ) : (
        stats.map((stat: any, i: number) => (
          <div
            key={i}
            className={`card-hover animate-in stagger-${i + 1} rounded-xl border p-4`}
            style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)', boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.03)' }}
          >
            <div className="mb-1.5 text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
              {t(stat.labelKey, { defaultValue: stat.labelKey?.split('.')[1] ?? stat.label })}
            </div>
            <div className="text-[28px] font-semibold leading-tight tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {(stat.value ?? 0).toLocaleString()}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
