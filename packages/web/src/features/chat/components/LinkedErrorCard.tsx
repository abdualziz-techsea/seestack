import { useNavigate } from 'react-router-dom'
import type { LinkedError } from '@seestack/shared'

interface LinkedErrorCardProps {
  error: LinkedError
}

export function LinkedErrorCard({ error }: LinkedErrorCardProps) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(`/errors`)}
      className="w-full rounded-lg border p-3 text-start transition-colors hover:bg-[var(--bg-hover)]"
      style={{ borderColor: 'var(--border-accent)', background: 'var(--primary-ghost)' }}
    >
      <div className="text-[13px] font-medium" style={{ color: 'var(--primary-text)' }}>{error.exceptionClass}</div>
      <div className="truncate text-[12px]" style={{ color: 'var(--text-secondary)' }}>{error.message}</div>
      <div className="mt-1 flex gap-2 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
        <span>{error.environment}</span>
        <span>{error.occurrences} occurrences</span>
        <span className="ms-auto font-medium" style={{ color: 'var(--primary-text)' }}>View →</span>
      </div>
    </button>
  )
}
