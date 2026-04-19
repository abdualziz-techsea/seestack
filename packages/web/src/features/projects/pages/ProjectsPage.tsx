import { useState } from 'react'
import { useProjects, useCreateProject } from '../hooks/useProjects'
import type { Project } from '@seestack/shared'
import { useAuthStore } from '@/store/auth.store'

export function ProjectsPage() {
  const { projects, isLoading, error, refetch } = useProjects()
  const { create, isLoading: creating, error: createErr } = useCreateProject()
  const currentProject = useAuthStore((s) => s.currentProject)
  const setCurrentProject = useAuthStore((s) => s.setCurrentProject)
  const [newName, setNewName] = useState('')
  const [revealedKeys, setRevealedKeys] = useState<Record<string, string>>({})
  const [openNew, setOpenNew] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    const created = await create({ name })
    setNewName('')
    setOpenNew(false)
    if (created?.apiKey && created.id) {
      setRevealedKeys((m) => ({ ...m, [created.id]: created.apiKey! }))
      // Select the new project so the SDK Setup page can show the raw key.
      setCurrentProject(created)
    }
    refetch()
  }

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-[22px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          Projects
        </h1>
        <button
          onClick={() => setOpenNew((o) => !o)}
          className="rounded-md px-3 py-1.5 text-[13px] font-medium"
          style={{ background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer' }}
        >
          {openNew ? 'Cancel' : '+ New project'}
        </button>
      </div>

      {openNew && (
        <form
          onSubmit={submit}
          className="mb-6 flex items-center gap-2 rounded-lg border p-3"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}
        >
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Project name, e.g. checkout-api"
            className="flex-1 bg-transparent text-[13px] outline-none"
            style={{ color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 6, padding: '8px 10px' }}
          />
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="rounded-md px-3 py-1.5 text-[13px] font-medium disabled:opacity-40"
            style={{ background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            {creating ? 'Creating…' : 'Create'}
          </button>
        </form>
      )}
      {createErr && (
        <div
          className="mb-4 rounded-md px-3 py-2 text-[13px]"
          style={{ background: 'var(--danger-ghost)', color: 'var(--danger)' }}
        >
          {createErr.message || 'Could not create project'}
        </div>
      )}

      {isLoading && (
        <div className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>Loading…</div>
      )}
      {error && (
        <div className="text-[13px]" style={{ color: 'var(--danger)' }}>
          {(error as Error).message}
        </div>
      )}

      {!isLoading && !error && projects.length === 0 && (
        <div
          className="rounded-lg border p-8 text-center"
          style={{ borderColor: 'var(--border)', color: 'var(--text-tertiary)' }}
        >
          <p className="text-[13px]">No projects yet. Create one to start receiving errors and monitoring websites.</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {projects.map((p: Project) => {
          const revealed = revealedKeys[p.id]
          const isCurrent = currentProject?.id === p.id
          return (
            <div
              key={p.id}
              className="rounded-lg border p-4"
              style={{
                borderColor: isCurrent ? 'var(--primary)' : 'var(--border)',
                background: 'var(--bg-surface)',
              }}
            >
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <div className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {p.name}
                  </div>
                  <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                    slug: {p.slug}
                    {p.platform ? ` · ${p.platform}` : ''}
                    {p.createdAt ? ` · created ${new Date(p.createdAt).toLocaleDateString()}` : ''}
                  </div>
                </div>
                {isCurrent ? (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{ background: 'var(--primary-ghost)', color: 'var(--primary-text)' }}
                  >
                    selected
                  </span>
                ) : (
                  <button
                    onClick={() => setCurrentProject({ ...p, apiKey: revealedKeys[p.id] ?? p.apiKey ?? null })}
                    className="rounded-md px-2.5 py-1 text-[12px]"
                    style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}
                  >
                    Select
                  </button>
                )}
              </div>

              <div
                className="mt-2 flex items-center gap-2 rounded-md border p-2 font-mono text-[12px]"
                style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)', color: 'var(--text-secondary)' }}
              >
                <span style={{ color: 'var(--text-tertiary)' }}>INGEST KEY</span>
                <span className="flex-1 truncate">
                  {revealed ?? (p.apiKeyPrefix ? p.apiKeyPrefix + '…' : '—')}
                </span>
                {revealed && (
                  <button
                    onClick={() => navigator.clipboard.writeText(revealed)}
                    className="rounded px-2 py-0.5 text-[11px]"
                    style={{ background: 'var(--primary-ghost)', color: 'var(--primary-text)', border: 'none', cursor: 'pointer' }}
                  >
                    Copy
                  </button>
                )}
              </div>
              {revealed && (
                <p className="mt-1 text-[11px]" style={{ color: 'var(--warning)' }}>
                  Save this key now — it will not be shown again.
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
