import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@seestack/shared'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import {
  LayoutDashboard,
  FolderOpen,
  AlertCircle,
  Activity,
  Code2,
  ShieldCheck,
  Gauge,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'

interface SidebarProps {
  collapsed: boolean
}

const items = [
  { to: '/overview', icon: LayoutDashboard, labelKey: 'nav.overview' },
  { to: '/projects', icon: FolderOpen, labelKey: 'nav.projects' },
  { to: '/errors', icon: AlertCircle, labelKey: 'nav.errors' },
  { to: '/monitors', icon: Activity, labelKey: 'nav.monitors' },
  { to: '/security-scan', icon: ShieldCheck, labelKey: 'nav.securityScan' },
  { to: '/load-test', icon: Gauge, labelKey: 'nav.loadTest' },
  { to: '/sdk-setup', icon: Code2, labelKey: 'nav.sdkSetup' },
]

export function Sidebar({ collapsed }: SidebarProps) {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-e transition-[width] duration-200',
        collapsed ? 'w-12' : 'w-[232px]'
      )}
      style={{
        borderColor: 'var(--border)',
        background: 'var(--bg-surface)',
        flexShrink: 0,
      }}
    >
      <div className="flex shrink-0 items-center justify-between px-3" style={{ height: 52 }}>
        <button
          onClick={toggleSidebar}
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-[var(--bg-hover)]',
            collapsed && 'mx-auto'
          )}
          style={{ color: 'var(--text-tertiary)' }}
        >
          {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
        </button>
      </div>

      <nav className="flex flex-1 flex-col overflow-y-auto" style={{ padding: '0 8px' }}>
        {items.map(({ to, icon: Icon, labelKey }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? t(labelKey) : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center transition-all',
                collapsed && 'justify-center',
                !isActive && 'hover:bg-[var(--bg-hover)]'
              )
            }
            style={({ isActive }) => ({
              height: 32,
              padding: collapsed ? '0px' : '0px 8px',
              borderRadius: 5,
              gap: 8,
              fontSize: 13,
              fontWeight: isActive ? 500 : 400,
              background: isActive ? 'var(--bg-active)' : undefined,
              color: isActive ? 'var(--primary-text)' : 'var(--text-secondary)',
              textDecoration: 'none',
              transition: 'background 80ms ease, color 80ms ease',
            })}
          >
            <Icon size={16} style={{ flexShrink: 0 }} />
            {!collapsed && <span>{t(labelKey)}</span>}
          </NavLink>
        ))}
      </nav>

      {user && (
        <div className="flex items-center gap-2 border-t" style={{ borderColor: 'var(--border)', padding: '8px 12px' }}>
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[8px] font-semibold"
            style={{ background: 'var(--primary-ghost)', color: 'var(--primary-text)' }}
          >
            {user.avatarInitials}
          </span>
          {!collapsed && (
            <span className="flex-1 truncate text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
              {user.name}
            </span>
          )}
        </div>
      )}
    </aside>
  )
}
