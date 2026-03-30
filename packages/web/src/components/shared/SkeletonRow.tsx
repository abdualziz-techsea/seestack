interface SkeletonRowProps {
  columns?: number
  height?: number
}

export function SkeletonRow({ columns = 4, height = 34 }: SkeletonRowProps) {
  return (
    <div className="flex items-center gap-4 px-4" style={{ height }}>
      {Array.from({ length: columns }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse"
          style={{
            background: 'var(--bg-elevated)',
            height: '14px',
            borderRadius: 5,
            width: i === 0 ? '30%' : i === columns - 1 ? '10%' : '15%',
          }}
        />
      ))}
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div
      className="animate-pulse rounded-lg border p-4"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}
    >
      <div className="mb-3 h-3 w-1/3" style={{ background: 'var(--bg-elevated)', borderRadius: 5 }} />
      <div className="mb-2 h-6 w-1/2" style={{ background: 'var(--bg-elevated)', borderRadius: 5 }} />
      <div className="h-3 w-2/3" style={{ background: 'var(--bg-elevated)', borderRadius: 5 }} />
    </div>
  )
}
