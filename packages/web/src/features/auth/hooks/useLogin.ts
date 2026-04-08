import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { apiClient } from '@seestack/shared'

// In dev, use the Vite proxy (/auth -> localhost:8180) to avoid CORS.
// In production, use the configured Keycloak URL.
const KEYCLOAK_URL = import.meta.env.PROD
  ? (import.meta.env.VITE_KEYCLOAK_URL ?? 'http://localhost:8180')
  : '/auth'
const KEYCLOAK_REALM = import.meta.env.VITE_KEYCLOAK_REALM ?? 'seestack'
const KEYCLOAK_CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? 'seestack-web'

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const setCurrentProject = useAuthStore((s) => s.setCurrentProject)

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    setError('')

    try {
      // 1. Authenticate with Keycloak
      const tokenUrl = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`
      const body = new URLSearchParams({
        grant_type: 'password',
        client_id: KEYCLOAK_CLIENT_ID,
        username: email,
        password,
      })

      const tokenRes = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      })

      if (!tokenRes.ok) {
        const data = await tokenRes.json().catch(() => ({}))
        throw new Error(data.error_description || 'Invalid credentials')
      }

      const tokenData = await tokenRes.json()
      const accessToken = tokenData.access_token

      // Store token so apiClient interceptor can use it
      localStorage.setItem('seestack_token', accessToken)

      // 2. Decode JWT for user info
      const payload = JSON.parse(atob(accessToken.split('.')[1]))
      const userName = payload.name || payload.preferred_username || email.split('@')[0]

      // 3. Fetch real orgs from backend
      const orgsRes = await apiClient.get('/api/v1/organizations')
      const orgs = orgsRes.data?.items ?? []
      const org = orgs[0] // Use first org

      // 4. Fetch real projects for this org
      let projects: any[] = []
      if (org) {
        const projRes = await apiClient.get('/api/v1/projects', { params: { orgId: org.id } })
        projects = projRes.data?.items ?? []
      }

      // 5. Set auth state with real data
      const user = {
        id: payload.sub,
        email: payload.email || email,
        name: userName,
        orgId: org?.id ?? '',
        orgRole: 'owner' as const,
        avatarInitials: userName[0]?.toUpperCase() + (userName[1]?.toUpperCase() ?? ''),
      }

      setAuth({
        user,
        org: org ? { id: org.id, name: org.name, slug: org.slug, plan: org.plan, timezone: 'Asia/Riyadh' } : null,
        projects: projects.map((p: any) => ({ id: p.id, orgId: p.orgId, name: p.name, slug: p.slug, platform: p.platform })),
        accessToken,
      })

      // Auto-select first project
      if (projects.length > 0) {
        setCurrentProject(projects[0])
      }

      navigate('/overview')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return { login, isLoading, error }
}
