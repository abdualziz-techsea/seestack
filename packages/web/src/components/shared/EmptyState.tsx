import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="animate-in flex flex-col items-center justify-center gap-3 py-16">
      {Icon && (
        <div
          className="flex h-12 w-12 items-center justify-center"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-tertiary)', borderRadius: 12 }}
        >
          <Icon size={24} />
        </div>
      )}
      <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>
      {description && (
        <p className="max-w-[240px] text-center text-[13px]" style={{ color: 'var(--text-secondary)' }}>
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
