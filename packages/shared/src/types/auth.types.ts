export interface User {
  id: string
  email: string
  name: string
  avatarInitials: string
}

export interface Project {
  id: string
  name: string
  slug: string
  platform?: string | null
  createdAt?: string
  apiKey?: string | null        // raw key, only surfaced right after creation
  apiKeyPrefix?: string | null  // safe preview ("ask_live_")
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  currentProject: Project | null
  projects: Project[]
}
