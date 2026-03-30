import { cn } from '@allstak/shared'

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
type BadgeSize = 'sm' | 'md' | 'lg'

interface BadgeProps {
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  children: React.ReactNode
  className?: string
}

const variantStyles: Record<BadgeVariant, { bg: string; color: string }> = {
  default: { bg: 'var(--bg-active)', color: 'var(--text-secondary)' },
  primary: { bg: 'var(--primary-ghost)', color: 'var(--primary-text)' },
  success: { bg: 'var(--success-ghost)', color: 'var(--success)' },
  warning: { bg: 'var(--warning-ghost)', color: '#f0b95b' },
  danger: { bg: 'var(--danger-ghost)', color: '#f75f5f' },
  info: { bg: 'var(--info-ghost)', color: '#6c9eff' },
}

const sizeMap: Record<BadgeSize, { height: number; padding: string; fontSize: number }> = {
  sm: { height: 18, padding: '0 6px', fontSize: 9 },
  md: { height: 22, padding: '0 8px', fontSize: 10 },
  lg: { height: 24, padding: '0 10px', fontSize: 11 },
}

export function Badge({ variant = 'default', size = 'md', dot, children, className }: BadgeProps) {
  const v = variantStyles[variant]
  const s = sizeMap[size]

  return (
    <span
      className={cn('inline-flex items-center font-medium', className)}
      style={{
        height: s.height,
        padding: s.padding,
        borderRadius: 999,
        fontSize: s.fontSize,
        lineHeight: 1,
        background: v.bg,
        color: v.color,
        gap: 5,
      }}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: v.color,
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  )
}
