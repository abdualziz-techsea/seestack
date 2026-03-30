import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, FolderOpen, CheckCircle } from 'lucide-react'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { useAuthStore } from '@/store/auth.store'
import { useProjectDetail, useUpdateProject } from '../hooks/useProjectDetail'

type Tab = 'overview' | 'settings'

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('overview')

  const currentProject = useAuthStore((s) => s.currentProject)
  const setCurrentProject = useAuthStore((s) => s.setCurrentProject)

  const { project, isLoading, refetch } = useProjectDetail(projectId!)
  const updateMutation = useUpdateProject(projectId!)

  // Settings form state
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')

  // Sync edit fields when project loads
  const [synced, setSynced] = useState(false)
  if (project && !synced) {
    setEditName(project.name ?? '')
    setEditDesc(project.description ?? '')
    setSynced(true)
  }

  const isCurrent = currentProject?.id === projectId

  const handleSetCurrent = () => {
    if (project) {
      setCurrentProject(project)
    }
  }

  const handleSaveSettings = async () => {
    setSaveState('saving')
    try {
      await updateMutation.mutateAsync({ name: editName, description: editDesc })
      await refetch()
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    } catch {
      setSaveState('idle')
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: t('projects.overview', { defaultValue: 'Overview' }) },
    { id: 'settings', label: t('projects.settingsTab', { defaultValue: 'Settings' }) },
  ]

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 animate-pulse rounded-lg" style={{ background: 'var(--bg-elevated)' }} />
        <div className="h-20 animate-pulse rounded-xl" style={{ background: 'var(--bg-elevated)' }} />
        <div className="h-48 animate-pulse rounded-xl" style={{ background: 'var(--bg-elevated)' }} />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
          {t('projects.notFound', { defaultValue: 'Project not found' })}
        </p>
        <button
          onClick={() => navigate('/projects')}
          className="mt-4 rounded-lg px-4 py-2 text-[13px] font-medium"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
        >
          ← {t('nav.projects', { defaultValue: 'Projects' })}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Back + Header */}
      <div>
        <button
          onClick={() => navigate('/projects')}
          className="mb-3 flex items-center gap-1.5 text-[12px] font-medium transition-colors hover:opacity-70"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <ArrowLeft size={13} />
          {t('nav.projects', { defaultValue: 'Projects' })}
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: 'var(--primary-ghost)', color: 'var(--primary-text)' }}
            >
              <FolderOpen size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-[18px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {project.name}
                </h1>
                {isCurrent && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{ background: 'var(--primary-ghost)', color: 'var(--primary-text)' }}
                  >
                    <CheckCircle size={10} />
                    {t('projects.current', { defaultValue: 'Current' })}
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-[12px] capitalize" style={{ color: 'var(--text-tertiary)' }}>
                  {project.platform}
                </span>
                <span style={{ color: 'var(--border)' }}>·</span>
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-medium capitalize"
                  style={{
                    background: project.status === 'active' ? 'var(--success-ghost)' : 'var(--bg-elevated)',
                    color: project.status === 'active' ? 'var(--success)' : 'var(--text-tertiary)',
                  }}
                >
                  {project.status}
                </span>
              </div>
            </div>
          </div>
          {!isCurrent && (
            <button
              onClick={handleSetCurrent}
              className="shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-medium"
              style={{ background: 'var(--primary)', color: 'white' }}
            >
              {t('projects.setCurrent', { defaultValue: 'Set as current' })}
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: t('projects.errorsLabel', { defaultValue: 'Errors' }), value: (project.errorsCount ?? 0).toLocaleString() },
          { label: t('projects.servers', { defaultValue: 'Servers' }), value: (project.serversCount ?? 0).toLocaleString() },
          { label: t('projects.slug', { defaultValue: 'Slug' }), value: project.slug },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border p-4"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)' }}
          >
            <div className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
              {label}
            </div>
            <div className="mt-1.5 font-mono text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: 'var(--border)' }}>
        {tabs.map((tObj) => (
          <button
            key={tObj.id}
            onClick={() => setTab(tObj.id)}
            className="px-4 py-2 text-[13px] font-medium transition-colors"
            style={{
              color: tab === tObj.id ? 'var(--primary-text)' : 'var(--text-secondary)',
              borderBottom: tab === tObj.id ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {tObj.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <div className="space-y-3">
          {/* Quick links */}
          {[
            {
              label: t('nav.errors', { defaultValue: 'Errors' }),
              desc: t('projects.errorsDesc', { defaultValue: 'View and manage error events for this project' }),
              path: '/errors',
            },
            {
              label: t('nav.logs', { defaultValue: 'Logs' }),
              desc: t('projects.logsDesc', { defaultValue: 'Browse structured log output from this project' }),
              path: '/logs',
            },
            {
              label: t('nav.requests', { defaultValue: 'Requests' }),
              desc: t('projects.requestsDesc', { defaultValue: 'Inspect incoming HTTP requests and traces' }),
              path: '/requests',
            },
            {
              label: t('nav.monitors', { defaultValue: 'Monitors' }),
              desc: t('projects.monitorsDesc', { defaultValue: 'Uptime and performance monitoring endpoints' }),
              path: '/monitors',
            },
          ].map(({ label, desc, path }) => (
            <button
              key={path}
              onClick={() => {
                if (!isCurrent && project) handleSetCurrent()
                navigate(path)
              }}
              className="flex w-full items-center justify-between rounded-xl border px-5 py-4 text-start transition-colors hover:bg-[var(--bg-hover)]"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)' }}
            >
              <div>
                <div className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{label}</div>
                <div className="mt-0.5 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>{desc}</div>
              </div>
              <span style={{ color: 'var(--text-tertiary)' }}>→</span>
            </button>
          ))}

          {/* Description */}
          {project.description && (
            <div
              className="rounded-xl border p-5"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)' }}
            >
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                {t('projects.descriptionLabel', { defaultValue: 'Description' })}
              </div>
              <p className="text-[13px]" style={{ color: 'var(--text-primary)' }}>{project.description}</p>
            </div>
          )}
        </div>
      )}

      {/* Settings tab */}
      {tab === 'settings' && (
        <div
          className="rounded-xl border p-6"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)' }}
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                {t('settings.workspaceName', { defaultValue: 'Project name' })}
              </label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-[13px] outline-none focus:border-[var(--primary)]"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                {t('projects.descriptionLabel', { defaultValue: 'Description' })}
              </label>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
                className="w-full rounded-lg border px-3 py-2 text-[13px] outline-none focus:border-[var(--primary)]"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)', resize: 'vertical' }}
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                {t('projects.platformLabel', { defaultValue: 'Platform' })}
              </label>
              <input
                value={project.platform ?? ''}
                disabled
                className="w-full rounded-lg border px-3 py-2 text-[13px] opacity-60 outline-none"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={saveState !== 'idle'}
              className="rounded-lg px-4 py-2 text-[13px] font-medium transition-all disabled:opacity-50"
              style={{
                background: saveState === 'saved' ? 'var(--success-ghost)' : 'var(--primary)',
                color: saveState === 'saved' ? 'var(--success)' : 'white',
              }}
            >
              {saveState === 'saving'
                ? t('common.saving', { defaultValue: 'Saving...' })
                : saveState === 'saved'
                  ? t('common.saved', { defaultValue: 'Saved' }) + ' ✓'
                  : t('common.save', { defaultValue: 'Save changes' })}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
