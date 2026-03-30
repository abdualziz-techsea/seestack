const statusColors: Record<string, string> = { up: 'var(--success)', down: 'var(--danger)', degraded: 'var(--warning)' }

interface MonitorSparklineProps {
  checks: string[]
}

export function MonitorSparkline({ checks }: MonitorSparklineProps) {
  const barWidth = 100 / checks.length
  return (
    <svg width="100%" height="20" viewBox="0 0 100 20" preserveAspectRatio="none">
      {checks.map((status, i) => (
        <rect key={i} x={i * barWidth} y="2" width={Math.max(barWidth - 0.5, 1)} height="16" rx="1" fill={statusColors[status] ?? 'var(--bg-elevated)'} />
      ))}
    </svg>
  )
}
