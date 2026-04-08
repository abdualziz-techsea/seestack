import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@seestack/shared'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { Logo } from '@/components/shared/Logo'
import {
  LayoutDashboard,
  FolderOpen,
  AlertCircle,
  FileText,
  ArrowLeftRight,
  Activity,
  Timer,
  ToggleLeft,
  Terminal,
  Bell,
  CreditCard,
  MessageSquare,
  Users,
  Settings,
  Key,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'

interface SidebarProps {
  collapsed: boolean
}

const sections = [
  {
    items: [
      { to: '/overview', icon: LayoutDashboard, labelKey: 'nav.overview' },
      { to: '/projects', icon: FolderOpen, labelKey: 'nav.projects' },
    ],
  },
  {
    labelKey: 'nav.sectionMonitor',
    items: [
      { to: '/errors', icon: AlertCircle, labelKey: 'nav.errors' },
      { to: '/logs', icon: FileText, labelKey: 'nav.logs' },
      { to: '/requests', icon: ArrowLeftRight, labelKey: 'nav.requests' },
      { to: '/monitors', icon: Activity, labelKey: 'nav.monitors' },
      { to: '/cron-monitors', icon: Timer, labelKey: 'nav.cronMonitors' },
      { to: '/flags', icon: ToggleLeft, labelKey: 'nav.flags' },
      { to: '/ssh', icon: Terminal, labelKey: 'nav.ssh' },
      { to: '/alerts', icon: Bell, labelKey: 'nav.alerts' },
      { to: '/billing', icon: CreditCard, labelKey: 'nav.billing' },
    ],
  },
  {
    labelKey: 'nav.sectionTeam',
    items: [
      { to: '/chat', icon: MessageSquare, labelKey: 'nav.chat' },
      { to: '/settings/members', icon: Users, labelKey: 'nav.members' },
    ],
  },
  {
    labelKey: 'nav.sectionSettings',
    items: [
      { to: '/settings/general', icon: Settings, labelKey: 'nav.settings' },
      { to: '/settings/api-keys', icon: Key, labelKey: 'nav.apiKeys' },
    ],
  },
]

export function Sidebar({ collapsed }: SidebarProps) {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const org = useAuthStore((s) => s.org)
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
      {/* Header — hidden when sidebar is used alongside topbar that already has logo */}
      <div className="flex shrink-0 items-center justify-between px-3" style={{ height: 52 }}>
        {!collapsed && (
          <button
            onClick={toggleSidebar}
            className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-[var(--bg-hover)]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <PanelLeftClose size={14} />
          </button>
        )}
        {collapsed && (
          <button
            onClick={toggleSidebar}
            className="mx-auto flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-[var(--bg-hover)]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <PanelLeftOpen size={14} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col overflow-y-auto" style={{ padding: '0 8px' }}>
        {sections.map((section, si) => (
          <div key={si}>
            {section.labelKey && !collapsed && (
              <div
                className="font-medium uppercase"
                style={{
                  color: 'var(--text-tertiary)',
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  padding: '14px 8px 4px',
                }}
              >
                {t(section.labelKey)}
              </div>
            )}
            {section.labelKey && collapsed && <div className="my-2 border-t" style={{ borderColor: 'var(--border)' }} />}
            {section.items.map(({ to, icon: Icon, labelKey }) => (
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
          </div>
        ))}
      </nav>

      {/* Bottom user row */}
      {user && (
        <div className="flex items-center gap-2 border-t" style={{ borderColor: 'var(--border)', padding: '8px 12px' }}>
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[8px] font-semibold"
            style={{ background: 'var(--primary-ghost)', color: 'var(--primary-text)' }}
          >
            {user.avatarInitials}
          </span>
          {!collapsed && (
            <>
              <span className="flex-1 truncate text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                {user.name}
              </span>
              {org && (
                <span
                  className="shrink-0 rounded-full text-[10px] font-medium"
                  style={{ background: 'var(--primary-ghost)', color: 'var(--primary-text)', padding: '1px 6px' }}
                >
                  {org.plan.charAt(0).toUpperCase() + org.plan.slice(1)}
                </span>
              )}
            </>
          )}
        </div>
      )}
    </aside>
  )
}
