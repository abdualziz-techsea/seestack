type AvatarSize = 'sm' | 'md' | 'lg'
type StatusType = 'online' | 'away' | 'offline'

const sizes: Record<AvatarSize, { size: number; font: number }> = {
  sm: { size: 24, font: 9 },
  md: { size: 30, font: 10 },
  lg: { size: 38, font: 13 },
}

const statusColors: Record<StatusType, string> = {
  online: 'var(--success)',
  away: 'var(--warning)',
  offline: 'var(--text-tertiary)',
}

interface AvatarProps {
  initials: string
  size?: AvatarSize
  status?: StatusType
  color?: string
  bgColor?: string
}

export function Avatar({ initials, size = 'md', status, color, bgColor }: AvatarProps) {
  const s = sizes[size]
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: s.size,
        height: s.size,
        borderRadius: '50%',
        background: bgColor || 'var(--primary-ghost)',
        color: color || 'var(--primary-text)',
        fontSize: s.font,
        fontWeight: 600,
        flexShrink: 0,
        position: 'relative',
      }}
    >
      {initials}
      {status && (
        <span
          style={{
            position: 'absolute',
            bottom: -1,
            right: -1,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: statusColors[status],
            border: '1.5px solid var(--bg-base)',
          }}
        />
      )}
    </div>
  )
}

interface AvatarGroupProps {
  items: { initials: string; color?: string; bgColor?: string }[]
  size?: AvatarSize
  max?: number
}

export function AvatarGroup({ items, size = 'sm', max = 5 }: AvatarGroupProps) {
  const visible = items.slice(0, max)
  const remaining = items.length - max

  return (
    <div style={{ display: 'flex' }}>
      {visible.map((item, i) => (
        <div key={i} style={{ marginLeft: i > 0 ? -6 : 0, border: '2px solid var(--bg-base)', borderRadius: '50%' }}>
          <Avatar {...item} size={size} />
        </div>
      ))}
      {remaining > 0 && (
        <div style={{ marginLeft: -6, border: '2px solid var(--bg-base)', borderRadius: '50%' }}>
          <Avatar initials={`+${remaining}`} size={size} bgColor="var(--bg-elevated)" color="var(--text-tertiary)" />
        </div>
      )}
    </div>
  )
}
