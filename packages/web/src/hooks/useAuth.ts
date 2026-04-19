import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth.store'

/**
 * On first mount, hydrate the auth store from the stored JWT.
 * Source of truth: the signed token issued by /api/auth/login or register.
 */
export function useAuth() {
  const { user, accessToken, setAuth } = useAuthStore()

  useEffect(() => {
    if (accessToken || user) return
    const token = localStorage.getItem('seestack_token')
    if (!token) return
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('seestack_token')
        return
      }
      setAuth({
        accessToken: token,
        user: {
          id: payload.sub,
          email: payload.email ?? '',
          name: payload.email ?? 'User',
          avatarInitials: (payload.email?.[0] ?? 'U').toUpperCase(),
        },
      })
    } catch {
      localStorage.removeItem('seestack_token')
    }
  }, [user, accessToken, setAuth])
}
