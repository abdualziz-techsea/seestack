import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { cn } from '@allstak/shared'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { LangToggle } from '@/components/shared/LangToggle'
import { Logo } from '@/components/shared/Logo'
import { NotificationDropdown } from '@/components/shared/NotificationDropdown'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'
import {
  Search,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Plus,
  FolderOpen,
  Check,
} from 'lucide-react'

export function Topbar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const projects = useAuthStore((s) => s.projects)
  const currentProject = useAuthStore((s) => s.currentProject)
  const setCurrentProject = useAuthStore((s) => s.setCurrentProject)
  const logout = useAuthStore((s) => s.logout)
  const theme = useUIStore((s) => s.theme)
  const [projectMenuOpen, setProjectMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const projectRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  const { notifications, unreadCount, loading: notifLoading, error: notifError, markRead, markAllRead } =
    useNotifications(currentProject?.id)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (projectRef.current && !projectRef.current.contains(e.target as Node)) setProjectMenuOpen(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setProjectMenuOpen(false); setUserMenuOpen(false); setNotifOpen(false) }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => { document.removeEventListener('mousedown', handleClick); document.removeEventListener('keydown', handleKey) }
  }, [])

  return (
    <header
      className="flex shrink-0 items-center border-b"
      style={{
        height: 52,
        borderColor: 'var(--border)',
        background: theme === 'light' ? 'rgba(250,250,250,0.8)' : 'rgba(5,5,5,0.75)',
        backdropFilter: 'blur(12px) saturate(1.2)',
        padding: '0 16px',
        gap: 12,
      }}
    >
      {/* Left: Logo + separator + project */}
      <a href="/overview" className="flex items-center gap-1.5 text-sm font-semibold no-underline" style={{ color: 'var(--text-primary)', letterSpacing: '-0.012em' }}>
        <Logo size={20} />
        AllStak
      </a>
      <span className="text-base font-light" style={{ color: 'var(--text-disabled)' }}>/</span>
      <div className="relative" ref={projectRef}>
        <button
          onClick={() => setProjectMenuOpen(!projectMenuOpen)}
          className="flex items-center gap-1 rounded px-2 py-1 text-[13px] font-medium transition-colors hover:bg-[var(--bg-hover)]"
          style={{ color: 'var(--text-secondary)' }}
        >
          {currentProject?.name ?? t('common.selectProject')}
          <ChevronDown size={14} style={{ transition: 'transform 0.15s', transform: projectMenuOpen ? 'rotate(180deg)' : undefined }} />
        </button>
        {projectMenuOpen && (
          <div
            className="animate-scale-in absolute start-0 top-full z-50 mt-1 min-w-[240px] overflow-hidden rounded-lg border shadow-lg"
            style={{ background: 'var(--bg-overlay)', borderColor: 'var(--border)' }}
          >
            {/* Project list */}
            <div className="p-1">
              {projects.length === 0 && (
                <div className="px-3 py-4 text-center">
                  <FolderOpen size={20} className="mx-auto mb-2" style={{ color: 'var(--text-tertiary)' }} />
                  <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                    {t('empty.noProjects', { defaultValue: 'No projects yet' })}
                  </p>
                </div>
              )}
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setCurrentProject(p); setProjectMenuOpen(false) }}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-[13px] transition-colors',
                    currentProject?.id !== p.id && 'hover:bg-[var(--bg-hover)]'
                  )}
                  style={{
                    color: currentProject?.id === p.id ? 'var(--primary-text)' : 'var(--text-primary)',
                    background: currentProject?.id === p.id ? 'var(--primary-ghost)' : undefined,
                    fontWeight: currentProject?.id === p.id ? 500 : 400,
                  }}
                >
                  <span className="flex-1 truncate text-start">{p.name}</span>
                  {currentProject?.id === p.id && <Check size={14} />}
                </button>
              ))}
            </div>
            {/* Create new project */}
            <div className="border-t p-1" style={{ borderColor: 'var(--border)' }}>
              <button
                onClick={() => { setProjectMenuOpen(false); navigate('/projects') }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors hover:bg-[var(--bg-hover)]"
                style={{ color: 'var(--primary-text)' }}
              >
                <Plus size={14} />
                {t('projects.createProject', { defaultValue: 'Create project' })}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Center: Search */}
      <div className="relative mx-auto w-full max-w-[280px]">
        <Search size={12} className="pointer-events-none absolute start-2 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
        <input
          readOnly
          placeholder={`${t('common.search', { defaultValue: 'Search' })} errors, logs...`}
          className="w-full border bg-[var(--bg-raised)] font-[inherit] text-xs outline-none"
          style={{
            height: 28,
            borderRadius: 8,
            paddingInlineStart: 28,
            paddingInlineEnd: 40,
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
          }}
        />
        <span
          className="pointer-events-none absolute end-2 top-1/2 -translate-y-1/2 rounded font-mono text-[10px]"
          style={{ color: 'var(--text-disabled)', background: 'var(--bg-active)', padding: '1px 4px' }}
        >
          ⌘K
        </span>
      </div>

      {/* Right: bells + toggles + avatar */}
      <div className="flex items-center gap-2">
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-1 transition-colors hover:text-[var(--text-primary)]"
            style={{ color: notifOpen ? 'var(--text-primary)' : 'var(--text-secondary)', background: 'none', border: 'none', fontSize: 16, cursor: 'pointer' }}
            aria-label="Notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span
                className="absolute -end-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
                style={{ background: 'var(--danger)', color: '#fff', lineHeight: 1 }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <NotificationDropdown
              notifications={notifications}
              loading={notifLoading}
              error={notifError}
              unreadCount={unreadCount}
              onMarkRead={markRead}
              onMarkAllRead={markAllRead}
            />
          )}
        </div>
        <ThemeToggle />
        <LangToggle />
        {user && (
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold"
              style={{ background: 'var(--primary-ghost)', color: 'var(--primary-text)', cursor: 'pointer' }}
            >
              {user.avatarInitials}
            </button>
            {userMenuOpen && (
              <div
                className="animate-scale-in absolute end-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border p-1 shadow-lg"
                style={{ background: 'var(--bg-overlay)', borderColor: 'var(--border)' }}
              >
                <div className="border-b px-3 py-2" style={{ borderColor: 'var(--border)' }}>
                  <div className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{user.name}</div>
                  <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{user.email}</div>
                </div>
                <button onClick={() => { setUserMenuOpen(false); navigate('/settings/general') }} className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-[13px] transition-colors hover:bg-[var(--bg-hover)]" style={{ color: 'var(--text-secondary)' }}>
                  <User size={14} /> {t('nav.profile')}
                </button>
                <button onClick={() => { setUserMenuOpen(false); navigate('/settings/general') }} className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-[13px] transition-colors hover:bg-[var(--bg-hover)]" style={{ color: 'var(--text-secondary)' }}>
                  <Settings size={14} /> {t('nav.settings')}
                </button>
                <div className="my-1 border-t" style={{ borderColor: 'var(--border)' }} />
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-[13px] transition-colors hover:bg-[var(--bg-hover)]"
                  style={{ color: 'var(--danger)' }}
                >
                  <LogOut size={14} /> {t('auth.signOut')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
