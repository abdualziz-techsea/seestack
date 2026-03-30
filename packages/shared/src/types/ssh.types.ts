export interface SshServer {
  id: string
  projectId: string
  name: string
  host: string
  port: number
  username: string
  createdAt: string
}

export interface SshAuditEntry {
  id: string
  serverId: string
  projectId: string
  userId: string
  command?: string | null
  output?: string | null
  timestamp: string
}
