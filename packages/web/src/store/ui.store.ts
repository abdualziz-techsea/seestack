import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIStore {
  theme: 'dark' | 'light'
  lang: 'en' | 'ar'
  sidebarCollapsed: boolean
  toggleTheme: () => void
  toggleLang: () => void
  toggleSidebar: () => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      lang: 'en',
      sidebarCollapsed: false,

      toggleTheme: () =>
        set((s) => {
          const next = s.theme === 'dark' ? 'light' : 'dark'
          document.documentElement.setAttribute('data-theme', next)
          return { theme: next }
        }),

      toggleLang: () =>
        set((s) => {
          const next = s.lang === 'en' ? 'ar' : 'en'
          document.documentElement.lang = next
          document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr'
          return { lang: next }
        }),

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    { name: 'seestack-ui' }
  )
)
