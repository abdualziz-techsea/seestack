import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  AlertCircle,
  FileText,
  Activity,
  Terminal,
  MessageSquare,
  Bell,
  CreditCard,
  Settings,
  Plus,
  Search,
} from 'lucide-react'

const navCommands = [
  { to: '/overview', icon: LayoutDashboard, labelKey: 'nav.overview' },
  { to: '/errors', icon: AlertCircle, labelKey: 'nav.errors' },
  { to: '/logs', icon: FileText, labelKey: 'nav.logs' },
  { to: '/monitors', icon: Activity, labelKey: 'nav.monitors' },
  { to: '/ssh', icon: Terminal, labelKey: 'nav.ssh' },
  { to: '/chat', icon: MessageSquare, labelKey: 'nav.chat' },
  { to: '/alerts', icon: Bell, labelKey: 'nav.alerts' },
  { to: '/billing', icon: CreditCard, labelKey: 'nav.billing' },
  { to: '/settings/general', icon: Settings, labelKey: 'nav.settings' },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()
  const { t } = useTranslation()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
        setQuery('')
        setSelectedIndex(0)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const filtered = navCommands.filter((c) =>
    t(c.labelKey).toLowerCase().includes(query.toLowerCase())
  )

  const handleSelect = (to: string) => {
    navigate(to)
    setOpen(false)
    setQuery('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      handleSelect(filtered[selectedIndex].to)
    }
  }

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50"
        style={{ backdropFilter: 'blur(4px)' }}
        onClick={() => setOpen(false)}
      />
      <div
        className="fixed left-1/2 top-[20%] z-50 w-full max-w-[520px] -translate-x-1/2 rounded-xl border shadow-2xl"
        style={{ background: 'var(--bg-overlay)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
          <Search size={16} style={{ color: 'var(--text-tertiary)' }} />
          <input
            autoFocus
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0) }}
            onKeyDown={handleKeyDown}
            placeholder={t('common.search') + '...'}
            className="flex-1 bg-transparent text-sm outline-none focus-visible:outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
          <kbd className="rounded border px-1.5 py-0.5 text-[10px]" style={{ borderColor: 'var(--border)', color: 'var(--text-tertiary)' }}>
            ESC
          </kbd>
        </div>
        <div className="max-h-[320px] overflow-y-auto p-2">
          <div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
            Navigation
          </div>
          {filtered.map((cmd, i) => (
            <button
              key={cmd.to}
              onClick={() => handleSelect(cmd.to)}
              className="flex w-full items-center gap-3 px-3 py-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              style={{
                borderRadius: 5,
                background: i === selectedIndex ? 'var(--bg-active)' : 'transparent',
                color: i === selectedIndex ? 'var(--primary-text)' : 'var(--text-secondary)',
              }}
            >
              <cmd.icon size={16} />
              {t(cmd.labelKey)}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-4 text-center text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
              No results found
            </div>
          )}
        </div>
      </div>
    </>
  )
}
