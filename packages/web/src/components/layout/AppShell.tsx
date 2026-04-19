import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { CommandPalette } from '@/components/shared/CommandPalette'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { useAuth } from '@/hooks/useAuth'
import { useProjects } from '@/features/projects/hooks/useProjects'

export function AppShell() {
  const navigate = useNavigate()
  useAuth()
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const currentProject = useAuthStore((s) => s.currentProject)
  const setCurrentProject = useAuthStore((s) => s.setCurrentProject)
  const theme = useUIStore((s) => s.theme)
  const lang = useUIStore((s) => s.lang)
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed)
  const { projects } = useProjects()

  useEffect(() => {
    if (!currentProject && projects.length > 0) {
      setCurrentProject(projects[0])
    }
  }, [currentProject, projects, setCurrentProject])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }, [theme, lang])

  // Auth guard — redirect to login if not authenticated
  useEffect(() => {
    if (!user && !accessToken && !localStorage.getItem('seestack_token')) {
      navigate('/login', { replace: true })
    }
  }, [user, accessToken, navigate])

  // Show nothing while redirecting
  if (!user && !accessToken && !localStorage.getItem('seestack_token')) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <Sidebar collapsed={sidebarCollapsed} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      <CommandPalette />
    </div>
  )
}
