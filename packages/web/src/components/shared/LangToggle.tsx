import { useUIStore } from '@/store/ui.store'
import { useTranslation } from 'react-i18next'

export function LangToggle() {
  const lang = useUIStore((s) => s.lang)
  const toggleLang = useUIStore((s) => s.toggleLang)
  const { i18n } = useTranslation()

  const handleToggle = () => {
    toggleLang()
    const next = lang === 'en' ? 'ar' : 'en'
    i18n.changeLanguage(next)
  }

  return (
    <button
      onClick={handleToggle}
      className="flex h-8 items-center justify-center rounded-md px-2 text-xs font-medium transition-colors"
      style={{ color: 'var(--text-secondary)' }}
      aria-label="Toggle language"
    >
      {lang === 'en' ? 'EN' : 'AR'}
    </button>
  )
}
