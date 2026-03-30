import { useTranslation } from 'react-i18next'

interface FilterGroupProps {
  options: { value: string; label: string }[]
  active: string
  onChange: (v: string) => void
}

function FilterGroup({ options, active, onChange }: FilterGroupProps) {
  return (
    <div
      className="flex overflow-hidden"
      style={{
        border: '1px solid var(--border-strong)',
        borderRadius: 6,
      }}
    >
      {options.map((opt, i) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: '4px 10px',
            fontSize: 12,
            fontWeight: 500,
            background: active === opt.value ? 'var(--primary-ghost)' : 'transparent',
            color: active === opt.value ? 'var(--primary-text)' : 'var(--text-secondary)',
            border: 'none',
            borderLeft: i > 0 ? '1px solid var(--border-strong)' : 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.12s',
          }}
          onMouseEnter={(e) => {
            if (active !== opt.value) {
              e.currentTarget.style.color = 'var(--text-primary)'
              e.currentTarget.style.background = 'var(--bg-hover)'
            }
          }}
          onMouseLeave={(e) => {
            if (active !== opt.value) {
              e.currentTarget.style.color = 'var(--text-secondary)'
              e.currentTarget.style.background = 'transparent'
            }
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

interface LiveToggleProps {
  isLive: boolean
  onToggle: () => void
  label: string
}

function LiveToggle({ isLive, onToggle, label }: LiveToggleProps) {
  return (
    <div
      onClick={onToggle}
      className="flex items-center gap-1.5 cursor-pointer select-none"
      style={{ marginLeft: 'auto' }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: isLive ? 'var(--success)' : 'var(--text-disabled)',
          animation: isLive ? 'pulse 1.5s infinite' : 'none',
        }}
      />
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: isLive ? 'var(--primary-text)' : 'var(--text-secondary)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          position: 'relative',
          width: 32,
          height: 18,
          background: isLive ? 'var(--primary)' : 'var(--bg-raised)',
          border: `1px solid ${isLive ? 'var(--primary)' : 'var(--border-strong)'}`,
          borderRadius: 999,
          transition: 'all 0.15s',
          display: 'inline-block',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: isLive ? 16 : 2,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: isLive ? '#fff' : 'var(--text-tertiary)',
            transition: 'all 0.15s',
          }}
        />
      </span>
    </div>
  )
}

export interface LogFilters {
  level: string
  service: string
  timeRange: string
  search: string
  isLive: boolean
}

interface LogFilterBarProps {
  filters: LogFilters
  onFiltersChange: (filters: LogFilters) => void
  services: string[]
}

const TIME_RANGES = ['15m', '1h', '6h', '24h', '7d']

export function LogFilterBar({ filters, onFiltersChange, services }: LogFilterBarProps) {
  const { t } = useTranslation()

  const levelOptions = [
    { value: 'All', label: t('logs.all') },
    { value: 'Debug', label: t('logs.debug') },
    { value: 'Info', label: t('logs.info') },
    { value: 'Warn', label: t('logs.warn') },
    { value: 'Error', label: t('logs.error') },
    { value: 'Fatal', label: t('logs.fatal') },
  ]

  const serviceOptions = [
    { value: 'All', label: t('logs.all') },
    ...services.map((s) => ({ value: s, label: s })),
  ]

  const timeRangeOptions = TIME_RANGES.map((r) => ({ value: r, label: r }))

  const update = (partial: Partial<LogFilters>) =>
    onFiltersChange({ ...filters, ...partial })

  return (
    <div className="flex flex-wrap items-center gap-2" style={{ marginBottom: 16 }}>
      <FilterGroup
        options={levelOptions}
        active={filters.level}
        onChange={(level) => update({ level })}
      />
      <FilterGroup
        options={serviceOptions}
        active={filters.service}
        onChange={(service) => update({ service })}
      />
      <FilterGroup
        options={timeRangeOptions}
        active={filters.timeRange}
        onChange={(timeRange) => update({ timeRange })}
      />
      <input
        value={filters.search}
        onChange={(e) => update({ search: e.target.value })}
        placeholder={t('logs.searchPlaceholder')}
        style={{
          height: 28,
          padding: '0 10px',
          background: 'var(--bg-raised)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          color: 'var(--text-primary)',
          fontFamily: 'inherit',
          fontSize: 12,
          outline: 'none',
          width: 200,
        }}
      />
      <LiveToggle
        isLive={filters.isLive}
        onToggle={() => update({ isLive: !filters.isLive })}
        label={t('logs.liveTail')}
      />
    </div>
  )
}
