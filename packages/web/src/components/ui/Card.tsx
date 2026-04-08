import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@seestack/shared'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  selected?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingMap = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-6' }

export function Card({ hover, selected, padding = 'md', children, className, style, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border',
        paddingMap[padding],
        hover && 'card-hover cursor-pointer',
        className,
      )}
      style={{
        borderColor: selected ? 'var(--primary-border)' : 'var(--border)',
        background: 'var(--bg-raised)',
        boxShadow: hover
          ? 'var(--shadow-inset), var(--shadow-sm)'
          : 'var(--shadow-inset)',
        transition: 'border-color 150ms ease, box-shadow 150ms ease',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-4 flex items-center justify-between', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="font-semibold" style={{ color: 'var(--text-primary)', fontSize: 16, letterSpacing: '-0.015em' }}>
      {children}
    </h3>
  )
}
