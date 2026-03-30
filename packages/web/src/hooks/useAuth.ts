import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { apiClient } from '@allstak/shared'

export function useAuth() {
  const { user, org, currentProject, projects, accessToken, setAuth, setCurrentProject, logout } =
    useAuthStore()

  useEffect(() => {
    const token = localStorage.getItem('allstak_token')
    if (token && !user) {
      // Decode JWT to get basic user info
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const userName = payload.name || payload.preferred_username || payload.email || 'User'

        const userObj = {
          id: payload.sub,
          email: payload.email || '',
          name: userName,
          orgId: '',
          orgRole: 'owner' as const,
          avatarInitials: userName[0]?.toUpperCase() + (userName[1]?.toUpperCase() ?? ''),
        }

        setAuth({ user: userObj, accessToken: token })

        // Fetch real orgs
        apiClient.get('/api/v1/organizations')
          .then((orgsRes: any) => {
            const orgs = orgsRes.data?.items ?? []
            const firstOrg = orgs[0]
            if (firstOrg) {
              setAuth({
                user: { ...userObj, orgId: firstOrg.id },
                org: { id: firstOrg.id, name: firstOrg.name, slug: firstOrg.slug, plan: firstOrg.plan, timezone: 'Asia/Riyadh' },
              })
              // Fetch real projects
              return apiClient.get('/api/v1/projects', { params: { orgId: firstOrg.id } })
            }
          })
          .then((projRes: any) => {
            if (projRes) {
              const projectsList = (projRes.data?.items ?? []).map((p: any) => ({
                id: p.id, orgId: p.orgId, name: p.name, slug: p.slug, platform: p.platform,
              }))
              setAuth({ projects: projectsList })
              if (!currentProject && projectsList.length > 0) {
                setCurrentProject(projectsList[0])
              }
            }
          })
          .catch(() => {
            // Token expired or invalid — clear and redirect
            localStorage.removeItem('allstak_token')
          })
      } catch {
        // Invalid token format
        localStorage.removeItem('allstak_token')
      }
    }
  }, [])

  return {
    user,
    org,
    projects,
    currentProject,
    isAuthenticated: !!accessToken || !!localStorage.getItem('allstak_token'),
    setAuth,
    setCurrentProject,
    logout,
  }
}
