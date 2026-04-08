import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@seestack/shared'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
  loading?: boolean
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: 'var(--gradient-brand)',
    color: '#fff',
    border: 'none',
    boxShadow: '0 1px 2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
  },
  secondary: {
    background: 'var(--bg-raised)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-strong)',
    boxShadow: 'var(--shadow-inset-subtle)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: 'none',
  },
  danger: {
    background: 'var(--danger-ghost)',
    color: 'var(--danger)',
    border: '1px solid rgba(247,95,95,0.12)',
  },
  success: {
    background: 'var(--success-ghost)',
    color: 'var(--success)',
    border: '1px solid rgba(62,207,142,0.12)',
  },
}

const sizeStyles: Record<ButtonSize, { height: number; padding: string; fontSize: number; borderRadius: number }> = {
  sm: { height: 28, padding: '0 10px', fontSize: 12, borderRadius: 5 },
  md: { height: 32, padding: '0 12px', fontSize: 13, borderRadius: 5 },
  lg: { height: 36, padding: '0 16px', fontSize: 14, borderRadius: 8 },
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', icon, loading, children, className, style, disabled, ...props }, ref) => {
    const v = variantStyles[variant]
    const s = sizeStyles[size]

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'btn-press inline-flex items-center justify-center font-medium',
          'disabled:opacity-35 disabled:cursor-not-allowed',
          'active:not-disabled:scale-[0.975]',
          variant === 'primary' && 'hover:not-disabled:brightness-110',
          variant === 'secondary' && 'hover:not-disabled:bg-[var(--bg-hover)] hover:not-disabled:text-[var(--text-primary)]',
          variant === 'ghost' && 'hover:not-disabled:bg-[var(--bg-hover)] hover:not-disabled:text-[var(--text-primary)]',
          variant === 'danger' && 'hover:not-disabled:brightness-110',
          variant === 'success' && 'hover:not-disabled:brightness-110',
          className,
        )}
        style={{
          ...v,
          height: s.height,
          padding: s.padding,
          fontSize: s.fontSize,
          borderRadius: s.borderRadius,
          gap: 6,
          fontFamily: 'inherit',
          cursor: disabled || loading ? 'not-allowed' : 'pointer',
          transition: 'filter 80ms ease, box-shadow 80ms ease, transform 80ms ease, background 150ms ease',
          ...style,
        }}
        onMouseEnter={(e) => {
          if (variant === 'primary' && !disabled && !loading) {
            e.currentTarget.style.filter = 'brightness(1.1)'
            e.currentTarget.style.boxShadow =
              '0 1px 2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 12px var(--primary-glow)'
          }
          props.onMouseEnter?.(e)
        }}
        onMouseLeave={(e) => {
          if (variant === 'primary' && !disabled && !loading) {
            e.currentTarget.style.filter = ''
            e.currentTarget.style.boxShadow =
              '0 1px 2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
          }
          props.onMouseLeave?.(e)
        }}
        {...props}
      >
        {loading && (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
        )}
        {!loading && icon}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
