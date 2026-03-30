interface PlatformOption {
  value: string
  label: string
  icon: string
}

interface PlatformGridProps {
  options: PlatformOption[]
  value: string
  onChange: (value: string) => void
  label?: string
}

export function PlatformGrid({ options, value, onChange, label }: PlatformGridProps) {
  return (
    <div>
      {label && (
        <label className="mb-2 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <div className="grid grid-cols-3 gap-2.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="flex flex-col items-center gap-2 transition-all"
            style={{
              padding: '20px 12px',
              border: `2px solid ${value === opt.value ? 'var(--primary)' : 'var(--border-strong)'}`,
              borderRadius: 10,
              background: value === opt.value ? 'var(--primary-ghost)' : 'var(--bg-surface)',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <span style={{ fontSize: 28, lineHeight: 1 }}>{opt.icon}</span>
            <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
