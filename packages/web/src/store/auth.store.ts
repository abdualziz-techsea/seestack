import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthState, Project } from '@allstak/shared'

interface AuthStore extends AuthState {
  setAuth: (state: Partial<AuthState>) => void
  setCurrentProject: (project: Project) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      org: null,
      projects: [],
      currentProject: null,
      accessToken: null,

      setAuth: (state) => set((prev) => ({ ...prev, ...state })),

      setCurrentProject: (project) => set({ currentProject: project }),

      logout: () => {
        localStorage.removeItem('allstak_token')
        set({ user: null, org: null, projects: [], currentProject: null, accessToken: null })
        window.location.href = '/login'
      },
    }),
    { name: 'allstak-auth', partialize: (s) => ({ currentProject: s.currentProject }) }
  )
)
