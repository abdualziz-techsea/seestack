import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useUIStore } from '@/store/ui.store'

export function useLang() {
  const lang = useUIStore((s) => s.lang)
  const toggleLang = useUIStore((s) => s.toggleLang)
  const { i18n } = useTranslation()

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    i18n.changeLanguage(lang)
  }, [lang])

  return { lang, toggleLang, isRTL: lang === 'ar' }
}
