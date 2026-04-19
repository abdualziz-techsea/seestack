import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { LangToggle } from '@/components/shared/LangToggle'
import { Logo } from '@/components/shared/Logo'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { LogOut } from 'lucide-react'

export function Topbar() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const currentProject = useAuthStore((s) => s.currentProject)
  const logout = useAuthStore((s) => s.logout)
  const theme = useUIStore((s) => s.theme)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false)
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
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
      <a
        href="/overview"
        className="flex items-center gap-1.5 text-sm font-semibold no-underline"
        style={{ color: 'var(--text-primary)', letterSpacing: '-0.012em' }}
      >
        <Logo size={20} />
        SeeStack
      </a>
      {currentProject && (
        <>
          <span className="text-base font-light" style={{ color: 'var(--text-disabled)' }}>
            /
          </span>
          <span className="text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>
            {currentProject.name}
          </span>
        </>
      )}

      <div className="flex flex-1 items-center justify-end gap-2">
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
                  <div className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                    {user.name}
                  </div>
                  <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                    {user.email}
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-[13px] transition-colors hover:bg-[var(--bg-hover)]"
                  style={{ color: 'var(--danger)' }}
                >
                  <LogOut size={14} /> {t('auth.signOut', { defaultValue: 'Sign out' })}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
