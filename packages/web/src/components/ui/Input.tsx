import { forwardRef, useState, type InputHTMLAttributes } from 'react'
import { cn } from '@allstak/shared'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, style, disabled, onFocus, onBlur, ...props }, ref) => {
    const [focused, setFocused] = useState(false)
    const [hovered, setHovered] = useState(false)

    const borderColor = error
      ? 'var(--danger)'
      : focused
        ? 'var(--primary)'
        : hovered
          ? 'rgba(255,255,255,0.12)'
          : 'var(--border-strong)'

    const boxShadow = focused
      ? error
        ? '0 0 0 3px rgba(247,95,95,0.12)'
        : '0 0 0 3px var(--primary-glow)'
      : 'none'

    return (
      <div>
        {label && (
          <label
            className="block font-medium"
            style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 4 }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          disabled={disabled}
          className={cn('w-full outline-none', className)}
          style={{
            height: 36,
            padding: '0 12px',
            background: 'var(--bg-raised)',
            border: `1px solid ${borderColor}`,
            borderRadius: 8,
            color: 'var(--text-primary)',
            fontFamily: 'inherit',
            fontSize: 14,
            transition: 'border-color 80ms ease, box-shadow 80ms ease',
            boxShadow,
            opacity: disabled ? 0.4 : 1,
            cursor: disabled ? 'not-allowed' : undefined,
            ...style,
          }}
          onMouseEnter={(e) => {
            if (!disabled) setHovered(true)
            props.onMouseEnter?.(e)
          }}
          onMouseLeave={(e) => {
            setHovered(false)
            props.onMouseLeave?.(e)
          }}
          onFocus={(e) => {
            setFocused(true)
            onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            onBlur?.(e)
          }}
          {...props}
        />
        {error && <p className="mt-1 text-[11px]" style={{ color: 'var(--danger)' }}>{error}</p>}
        {hint && !error && <p className="mt-1 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
