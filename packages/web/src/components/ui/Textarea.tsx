import { forwardRef, useState, type TextareaHTMLAttributes } from 'react'
import { cn } from '@allstak/shared'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, style, disabled, onFocus, onBlur, ...props }, ref) => {
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
        ? '0 0 0 2px var(--danger-glow)'
        : '0 0 0 2px var(--primary-glow)'
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
        <textarea
          ref={ref}
          disabled={disabled}
          className={cn('w-full resize-vertical outline-none', className)}
          style={{
            minHeight: 80,
            padding: '10px 12px',
            background: 'var(--bg-raised)',
            border: `1px solid ${borderColor}`,
            borderRadius: 8,
            color: 'var(--text-primary)',
            fontFamily: 'inherit',
            fontSize: 13,
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
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
