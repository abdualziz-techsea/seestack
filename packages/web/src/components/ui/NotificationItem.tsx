interface NotificationItemProps {
  icon: string
  iconVariant: 'error' | 'monitor' | 'chat'
  title: string
  description: string
  time: string
  unread?: boolean
  onClick?: () => void
}

const iconBg: Record<string, { bg: string; color: string }> = {
  error: { bg: 'var(--danger-ghost)', color: 'var(--danger)' },
  monitor: { bg: 'var(--warning-ghost)', color: 'var(--warning)' },
  chat: { bg: 'var(--info-ghost)', color: 'var(--info)' },
}

export function NotificationItem({ icon, iconVariant, title, description, time, unread, onClick }: NotificationItemProps) {
  const colors = iconBg[iconVariant] || iconBg.chat

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        transition: 'background var(--duration-fast)',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = '' }}
    >
      <div style={{
        width: 30, height: 30, borderRadius: 'var(--radius-md)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, flexShrink: 0,
        background: colors.bg, color: colors.color,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-base)', fontWeight: 500 }}>{title}</div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 2 }}>{description}</div>
      </div>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', flexShrink: 0 }}>{time}</span>
      {unread && (
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 7 }} />
      )}
    </div>
  )
}
