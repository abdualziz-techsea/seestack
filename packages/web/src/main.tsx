import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { router } from '@/router'
import '@/i18n'
import '@/styles/tokens.css'

// Apply stored theme and lang on startup
const stored = JSON.parse(localStorage.getItem('seestack-ui') ?? '{}')
const theme = stored?.state?.theme ?? 'dark'
const lang = stored?.state?.lang ?? 'en'
document.documentElement.setAttribute('data-theme', theme)
document.documentElement.lang = lang
document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
)
