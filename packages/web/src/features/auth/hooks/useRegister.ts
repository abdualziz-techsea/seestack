import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '@seestack/shared'
import { useAuthStore } from '@/store/auth.store'

const KEYCLOAK_BASE = import.meta.env.PROD
  ? (import.meta.env.VITE_KEYCLOAK_URL ?? 'http://localhost:8180')
  : '/auth'
const KEYCLOAK_REALM = import.meta.env.VITE_KEYCLOAK_REALM ?? 'seestack'
const KEYCLOAK_CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? 'seestack-web'

interface RegisterData {
  name: string
  email: string
  password: string
  orgName: string
}

export function useRegister() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const setCurrentProject = useAuthStore((s) => s.setCurrentProject)

  const register = async (data: RegisterData) => {
    setIsLoading(true)
    setError('')
    try {
      // Step 1: Get Keycloak admin token (master realm)
      const adminTokenRes = await fetch(`${KEYCLOAK_BASE}/realms/master/protocol/openid-connect/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: 'admin-cli',
          username: 'admin',
          password: 'admin',
        }).toString(),
      })
      if (!adminTokenRes.ok) throw new Error('Failed to connect to auth server')
      const adminToken = (await adminTokenRes.json()).access_token

      // Step 2: Create user in Keycloak
      const [firstName, ...lastParts] = data.name.split(' ')
      const lastName = lastParts.join(' ') || firstName

      const createUserRes = await fetch(`${KEYCLOAK_BASE}/admin/realms/${KEYCLOAK_REALM}/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: data.email.split('@')[0],
          email: data.email,
          firstName,
          lastName,
          enabled: true,
          emailVerified: true,
          credentials: [{ type: 'password', value: data.password, temporary: false }],
        }),
      })

      if (createUserRes.status === 409) {
        throw new Error('An account with this email already exists')
      }
      if (!createUserRes.ok) {
        const errBody = await createUserRes.json().catch(() => ({}))
        throw new Error(errBody.errorMessage || 'Failed to create account')
      }

      // Step 3: Login as the new user to get access token
      const loginRes = await fetch(`${KEYCLOAK_BASE}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: KEYCLOAK_CLIENT_ID,
          username: data.email,
          password: data.password,
        }).toString(),
      })
      if (!loginRes.ok) throw new Error('Account created but login failed')
      const tokenData = await loginRes.json()
      const accessToken = tokenData.access_token

      // Store token for API calls
      localStorage.setItem('seestack_token', accessToken)

      // Step 4: Create organization via backend API
      const orgRes = await apiClient.post('/api/v1/organizations', {
        name: data.orgName,
        slug: data.orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      })
      const org = orgRes.data

      // Step 5: Create default project
      const projRes = await apiClient.post('/api/v1/projects', {
        orgId: org.id,
        name: 'Default Project',
        slug: 'default',
        platform: 'node',
      })
      const project = projRes.data

      // Step 6: Set auth state
      const payload = JSON.parse(atob(accessToken.split('.')[1]))
      const userName = data.name || payload.preferred_username || data.email.split('@')[0]

      setAuth({
        user: {
          id: payload.sub,
          email: data.email,
          name: userName,
          orgId: org.id,
          orgRole: 'owner' as const,
          avatarInitials: userName[0]?.toUpperCase() + (userName[1]?.toUpperCase() ?? ''),
        },
        org: { id: org.id, name: org.name, slug: org.slug, plan: org.plan || 'free', timezone: 'Asia/Riyadh' },
        projects: [{ id: project.id, orgId: org.id, name: project.name, slug: project.slug, platform: project.platform }],
        accessToken,
      })
      setCurrentProject({ id: project.id, orgId: org.id, name: project.name, slug: project.slug, platform: project.platform })

      // Navigate to dashboard
      navigate('/overview')
    } catch (err: any) {
      const message = err.message || 'Registration failed'
      setError(message)
      throw new Error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return { register, isLoading, error }
}
