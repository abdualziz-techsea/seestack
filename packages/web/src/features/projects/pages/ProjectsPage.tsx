import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Search, FolderOpen, MoreVertical, ExternalLink } from 'lucide-react'
import { Button, Card, Badge, PageHeader } from '@/components/ui'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { useProjects, type Project } from '../hooks/useProjects'
import { useAuthStore } from '@/store/auth.store'

export function ProjectsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { projects, isLoading } = useProjects()
  const currentProject = useAuthStore((s) => s.currentProject)
  const setCurrentProject = useAuthStore((s) => s.setCurrentProject)
  const allProjects = useAuthStore((s) => s.projects)
  const [search, setSearch] = useState('')

  const displayProjects: Project[] = projects.length > 0
    ? projects
    : allProjects.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        platform: p.platform,
        status: 'active' as const,
        serversCount: 0,
        errorsCount: 0,
        createdAt: new Date().toISOString(),
      }))

  const filtered = displayProjects.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade">
      <PageHeader
        title={t('nav.projects')}
        actions={
          <Button icon={<Plus size={14} />} onClick={() => navigate('/projects/new')}>
            {t('projects.createProject')}
          </Button>
        }
      />

      {/* Search */}
      <div className="animate-in stagger-1 mb-4">
        <div
          className="flex items-center gap-2 rounded-lg border px-3 py-2"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}
        >
          <Search size={14} style={{ color: 'var(--text-tertiary)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('projects.searchPlaceholder')}
            className="flex-1 bg-transparent text-[13px] outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><SkeletonRow /><div className="mt-3"><SkeletonRow /></div></Card>
          ))}
        </div>
      )}

      {/* Project cards */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project, i) => (
            <Card
              key={project.id}
              hover
              className={`animate-in stagger-${Math.min(i + 2, 6)}`}
              onClick={() => { setCurrentProject(project as any); navigate(`/projects/${project.id}`) }}
              style={{
                borderColor: currentProject?.id === project.id ? 'var(--primary-border)' : undefined,
              }}
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ background: 'var(--primary-ghost)', color: 'var(--primary-text)' }}
                  >
                    <FolderOpen size={18} />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {project.name}
                    </div>
                    <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                      {project.platform}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {currentProject?.id === project.id && (
                    <Badge variant="primary">{t('projects.current')}</Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                <span>{t('projects.servers')}: {project.serversCount}</span>
                <span>{t('projects.errorsLabel')}: {project.errorsCount}</span>
              </div>

              <div
                className="mt-3 flex items-center border-t pt-3 text-[11px]"
                style={{ borderColor: 'var(--border)', color: 'var(--text-tertiary)' }}
              >
                <Badge variant={project.status === 'active' ? 'success' : 'default'}>
                  {project.status === 'active' ? t('common.active') : t('projects.archived')}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div className="animate-in flex flex-col items-center justify-center py-20">
          <div
            className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: 'var(--primary-ghost)', color: 'var(--primary-text)' }}
          >
            <FolderOpen size={28} />
          </div>
          <h3 className="mb-1 text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            {search ? t('projects.noResults') : t('empty.noProjects')}
          </h3>
          <p className="mb-4 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            {search ? t('projects.tryDifferentSearch') : t('projects.emptyDescription')}
          </p>
          {!search && (
            <Button icon={<Plus size={14} />} onClick={() => navigate('/projects/new')}>
              {t('projects.createFirst')}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
