import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { LangToggle } from '@/components/shared/LangToggle'

export function AuthLayout() {
  const { t } = useTranslation()

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{
        background: 'var(--bg-base)',
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
    >
      {/* Auth topbar */}
      <header
        className="flex shrink-0 items-center justify-between px-6"
        style={{ height: 56 }}
      >
        <a href="/" className="flex items-center gap-2 text-decoration-none">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="8" height="8" rx="2" fill="var(--primary)" />
            <rect x="13" y="3" width="8" height="8" rx="2" fill="var(--primary)" opacity=".6" />
            <rect x="3" y="13" width="8" height="8" rx="2" fill="var(--primary)" opacity=".6" />
            <rect x="13" y="13" width="8" height="8" rx="2" fill="var(--primary)" opacity=".3" />
          </svg>
          <span
            className="text-[15px] font-semibold"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.012em' }}
          >
            SeeStack
          </span>
        </a>
        <div className="flex items-center gap-3">
          <LangToggle />
          <ThemeToggle />
        </div>
      </header>

      {/* Content */}
      <main className="flex flex-1 items-center justify-center px-6 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer
        className="flex shrink-0 items-center justify-center gap-4 py-4 text-xs"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <a href="#" className="transition-colors hover:text-[var(--text-secondary)]" style={{ color: 'inherit' }}>
          {t('auth.privacy', { defaultValue: 'Privacy Policy' })}
        </a>
        <a href="#" className="transition-colors hover:text-[var(--text-secondary)]" style={{ color: 'inherit' }}>
          {t('auth.terms', { defaultValue: 'Terms of Service' })}
        </a>
        <a href="#" className="transition-colors hover:text-[var(--text-secondary)]" style={{ color: 'inherit' }}>
          {t('auth.status', { defaultValue: 'Status' })}
        </a>
      </footer>
    </div>
  )
}
