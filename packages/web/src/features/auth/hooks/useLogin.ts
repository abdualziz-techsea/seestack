import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { apiClient } from '@seestack/shared'

/**
 * Internal email+password auth. Posts to /api/auth/{login|register}
 * and stores the issued JWT + user in the Zustand store.
 */
export function useLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const setCurrentProject = useAuthStore((s) => s.setCurrentProject)

  const runAuth = async (path: '/api/auth/login' | '/api/auth/register', body: any) => {
    setIsLoading(true)
    setError('')
    try {
      const res: any = await apiClient.post(path, body)
      const payload = res?.token ? res : res?.data ?? res
      if (!payload?.token) throw new Error('Authentication failed')
      localStorage.setItem('seestack_token', payload.token)
      setAuth({
        accessToken: payload.token,
        user: {
          id: payload.user.id,
          email: payload.user.email,
          name: payload.user.name ?? payload.user.email,
          avatarInitials: (payload.user.email?.[0] ?? 'U').toUpperCase(),
        },
      })
      if (payload.project) {
        setCurrentProject({
          id: payload.project.id,
          name: payload.project.name,
          slug: payload.project.slug,
          apiKey: payload.project.apiKey ?? null,
        })
      }
      navigate('/overview', { replace: true })
    } catch (err: any) {
      const msg = err?.error?.message ?? err?.message ?? 'Request failed'
      setError(msg)
      throw new Error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    login: (email: string, password: string) => runAuth('/api/auth/login', { email, password }),
    register: (email: string, password: string, name?: string) =>
      runAuth('/api/auth/register', { email, password, name }),
    isLoading,
    error,
  }
}
