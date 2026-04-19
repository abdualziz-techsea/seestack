import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthState, Project } from '@seestack/shared'

interface AuthStore extends AuthState {
  setAuth: (state: Partial<AuthState>) => void
  setCurrentProject: (project: Project | null) => void
  setProjects: (projects: Project[]) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      currentProject: null,
      projects: [],

      setAuth: (state) => set((prev) => ({ ...prev, ...state })),
      setCurrentProject: (project) => set({ currentProject: project }),
      setProjects: (projects) => set({ projects }),
      logout: () => {
        localStorage.removeItem('seestack_token')
        set({ user: null, accessToken: null, currentProject: null, projects: [] })
        window.location.href = '/login'
      },
    }),
    { name: 'seestack-auth', partialize: (s) => ({ currentProject: s.currentProject }) }
  )
)
