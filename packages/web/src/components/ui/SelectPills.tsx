interface SelectPillsProps {
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  label?: string
}

export function SelectPills({ options, value, onChange, label }: SelectPillsProps) {
  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="transition-all"
            style={{
              padding: '6px 16px',
              borderRadius: 999,
              border: `1px solid ${value === opt.value ? 'var(--primary-border)' : 'var(--border-strong)'}`,
              background: value === opt.value ? 'var(--primary-ghost)' : 'transparent',
              color: value === opt.value ? 'var(--primary-text)' : 'var(--text-secondary)',
              fontFamily: 'inherit',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
