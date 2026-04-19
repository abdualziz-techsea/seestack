import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StatCards } from '../components/StatCards'
import { ErrorTrendChart } from '../components/ErrorTrendChart'
import { RecentErrorsList } from '../components/RecentErrorsList'
import { MonitorStatusList } from '../components/MonitorStatusList'

export function OverviewPage() {
  const { t } = useTranslation()
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('7d')

  return (
    <div className="animate-fade">
      {/* Page header */}
      <div className="animate-in mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {t('nav.overview')}
        </h1>
        <div className="flex overflow-hidden rounded-md border" style={{ borderColor: 'var(--border-strong)' }}>
          {(['7d', '30d', '90d'] as const).map((r, i) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className="btn-press px-2.5 py-1 text-xs font-medium transition-colors"
              style={{
                background: range === r ? 'var(--primary-ghost)' : 'transparent',
                color: range === r ? 'var(--primary-text)' : 'var(--text-secondary)',
                borderInlineStart: i > 0 ? '1px solid var(--border-strong)' : undefined,
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="animate-in stagger-1 mb-6">
        <StatCards />
      </div>

      {/* Two-column layout: 3fr 2fr */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-5">
          <div className="animate-in stagger-2">
            <RecentErrorsList />
          </div>
          <div className="animate-in stagger-4">
            <ErrorTrendChart />
          </div>
        </div>
        <div className="space-y-5">
          <div className="animate-in stagger-3">
            <MonitorStatusList />
          </div>
        </div>
      </div>
    </div>
  )
}
