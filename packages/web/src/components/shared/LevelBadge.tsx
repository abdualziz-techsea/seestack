const levelConfig: Record<string, { bg: string; color: string; fontWeight?: number }> = {
  debug: { bg: 'var(--bg-active)', color: 'var(--text-tertiary)' },
  info: { bg: 'rgba(62,207,142,0.12)', color: 'var(--success)' },
  warn: { bg: 'var(--warning-ghost)', color: 'var(--warning-text)' },
  warning: { bg: 'var(--warning-ghost)', color: 'var(--warning-text)' },
  error: { bg: 'var(--danger-ghost)', color: 'var(--danger)' },
  fatal: { bg: 'var(--danger-ghost)', color: 'var(--danger)', fontWeight: 700 },
}

interface LevelBadgeProps {
  level: string
}

export function LevelBadge({ level }: LevelBadgeProps) {
  const config = levelConfig[level] ?? levelConfig.debug
  return (
    <span
      className="inline-flex items-center uppercase"
      style={{
        background: config.bg,
        color: config.color,
        height: 22,
        padding: '0 8px',
        borderRadius: 999,
        fontSize: 10,
        fontWeight: config.fontWeight ?? 600,
        letterSpacing: '0.02em',
        fontFamily: 'var(--font-mono)',
      }}
    >
      {level}
    </span>
  )
}
