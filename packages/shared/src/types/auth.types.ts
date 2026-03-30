export type OrgRole = 'owner' | 'admin' | 'member'
export type Plan = 'free' | 'starter' | 'pro' | 'scale'

export interface User {
  id: string
  email: string
  name: string
  orgId: string
  orgRole: OrgRole
  avatarInitials: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  plan: Plan
  timezone: string
}

export interface ProjectPermissions {
  errors: boolean
  logs: boolean
  monitors: boolean
  ssh: boolean
}

export interface Project {
  id: string
  orgId: string
  name: string
  slug: string
  platform: string
  permissions?: ProjectPermissions
}

export interface AuthState {
  user: User | null
  org: Organization | null
  projects: Project[]
  currentProject: Project | null
  accessToken: string | null
}
