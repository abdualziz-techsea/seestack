import { useEffect } from 'react'
import { useUIStore } from '@/store/ui.store'

export function useTheme() {
  const theme = useUIStore((s) => s.theme)
  const toggleTheme = useUIStore((s) => s.toggleTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return { theme, toggleTheme, isDark: theme === 'dark' }
}
