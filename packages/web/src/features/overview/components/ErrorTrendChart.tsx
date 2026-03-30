import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useUIStore } from '@/store/ui.store'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { useOverviewData } from '../hooks/useOverviewData'

const fallbackDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function ErrorTrendChart() {
  const { t } = useTranslation()
  const lang = useUIStore((s) => s.lang)
  const { data, isLoading } = useOverviewData()

  const chartData = data?.errorTrend ?? fallbackDays.map((d) => ({ day: d, dayAr: d, errors: 0 }))

  return (
    <div>
      <div className="mb-2.5">
        <span className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {t('overview.errorTrend', { defaultValue: 'Error Trend (7 days)' })}
        </span>
      </div>
      <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)' }}>
        {isLoading ? <SkeletonRow /> : (
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={chartData}>
              <XAxis dataKey={lang === 'ar' ? 'dayAr' : 'day'} tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} width={24} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-strong)', borderRadius: 6, fontSize: 11 }}
                labelStyle={{ color: 'var(--text-primary)' }}
                itemStyle={{ color: 'var(--primary)' }}
              />
              <Bar dataKey="errors" fill="var(--primary)" opacity={0.6} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
