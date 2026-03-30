interface Tab {
  key: string
  label: string
}

interface TabBarProps {
  tabs: Tab[]
  activeKey: string
  onChange: (key: string) => void
}

export function TabBar({ tabs, activeKey, onChange }: TabBarProps) {
  return (
    <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          style={{
            padding: '8px 14px',
            fontSize: 'var(--text-base)',
            color: activeKey === tab.key ? 'var(--text-primary)' : 'var(--text-tertiary)',
            cursor: 'pointer',
            borderBottom: `2px solid ${activeKey === tab.key ? 'var(--primary)' : 'transparent'}`,
            marginBottom: -1,
            background: 'none',
            border: 'none',
            borderTop: 'none',
            fontFamily: 'var(--font-sans)',
            fontWeight: 500,
            transition: 'all var(--duration-fast)',
          }}
          onMouseEnter={(e) => { if (activeKey !== tab.key) e.currentTarget.style.color = 'var(--text-secondary)' }}
          onMouseLeave={(e) => { if (activeKey !== tab.key) e.currentTarget.style.color = 'var(--text-tertiary)' }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
