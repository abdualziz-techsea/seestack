interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
}

export function Toggle({ checked, onChange, disabled, label }: ToggleProps) {
  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 'var(--text-base)',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <div
        onClick={() => !disabled && onChange(!checked)}
        style={{
          position: 'relative',
          width: 36,
          height: 20,
          borderRadius: 'var(--radius-full)',
          background: checked ? 'var(--primary)' : 'var(--bg-elevated)',
          border: `1px solid ${checked ? 'var(--primary)' : 'var(--border-strong)'}`,
          transition: 'all var(--duration-normal) ease',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 3,
            left: checked ? 19 : 3,
            width: 12,
            height: 12,
            background: '#fff',
            borderRadius: '50%',
            transition: 'transform var(--duration-normal) var(--spring)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
            pointerEvents: 'none',
          }}
        />
      </div>
      {label && <span style={{ color: 'var(--text-primary)' }}>{label}</span>}
    </label>
  )
}
