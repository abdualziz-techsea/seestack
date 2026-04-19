import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, AlertCircle, Activity, Search } from 'lucide-react'

const navCommands = [
  { to: '/overview', icon: LayoutDashboard, labelKey: 'nav.overview' },
  { to: '/errors', icon: AlertCircle, labelKey: 'nav.errors' },
  { to: '/monitors', icon: Activity, labelKey: 'nav.monitors' },
]

export function CommandPalette() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!open) return null

  const filtered = navCommands.filter((c) =>
    t(c.labelKey).toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-md rounded-lg border"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b px-3 py-2" style={{ borderColor: 'var(--border)' }}>
          <Search size={14} style={{ color: 'var(--text-tertiary)' }} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
        <ul className="max-h-80 overflow-auto p-1">
          {filtered.map(({ to, icon: Icon, labelKey }) => (
            <li key={to}>
              <button
                onClick={() => {
                  navigate(to)
                  setOpen(false)
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-[var(--bg-hover)]"
                style={{ color: 'var(--text-primary)' }}
              >
                <Icon size={14} />
                {t(labelKey)}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
