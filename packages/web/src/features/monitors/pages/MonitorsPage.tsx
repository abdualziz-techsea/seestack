import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { monitorsApi } from '@allstak/shared'
import type { Monitor } from '@allstak/shared'
import { useAuthStore } from '@/store/auth.store'
import { useMonitors } from '../hooks/useMonitors'
import { MonitorGrid } from '../components/MonitorGrid'
import { MonitorSummaryBar } from '../components/MonitorSummaryBar'
import { MonitorModal } from '../components/MonitorModal'

type ModalState =
  | { type: 'closed' }
  | { type: 'create' }
  | { type: 'edit'; monitor: Monitor }

export function MonitorsPage() {
  const { t } = useTranslation()
  const [modal, setModal] = useState<ModalState>({ type: 'closed' })
  const { monitors, isLoading } = useMonitors()
  const currentProject = useAuthStore((s) => s.currentProject)
  const queryClient = useQueryClient()

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['monitors', currentProject?.id] })

  const createMutation = useMutation({
    mutationFn: (data: { name: string; url: string; intervalMinutes: number }) =>
      monitorsApi.create({ ...data, projectId: currentProject!.id }),
    onSuccess: invalidate,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; url: string; intervalMinutes: number } }) =>
      monitorsApi.update(id, {
        projectId: currentProject!.id,
        name: data.name,
        url: data.url,
        intervalMinutes: data.intervalMinutes,
        isActive: true,
      }),
    onSuccess: invalidate,
  })

  const toggleMutation = useMutation({
    mutationFn: (m: Monitor) =>
      monitorsApi.update(m.id, {
        projectId: m.projectId,
        name: m.name,
        url: m.url,
        intervalMinutes: m.intervalMinutes,
        isActive: !m.isActive,
      }),
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: (m: Monitor) =>
      monitorsApi.delete(m.id, m.projectId),
    onSuccess: invalidate,
  })

  const handleEdit = useCallback((m: Monitor) => {
    setModal({ type: 'edit', monitor: m })
  }, [])

  const handleToggle = useCallback((m: Monitor) => {
    toggleMutation.mutate(m)
  }, [toggleMutation])

  const handleDelete = useCallback((m: Monitor) => {
    deleteMutation.mutate(m)
  }, [deleteMutation])

  const handleModalSubmit = async (data: { name: string; url: string; intervalMinutes: number }) => {
    if (modal.type === 'edit') {
      await updateMutation.mutateAsync({ id: modal.monitor.id, data })
    } else {
      await createMutation.mutateAsync(data)
    }
  }

  return (
    <div style={{ padding: 24 }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.022em', color: 'var(--text-primary)' }}>
          {t('monitors.title', { defaultValue: 'Monitors' })}
        </h1>
        <button
          onClick={() => setModal({ type: 'create' })}
          style={{
            height: 32,
            padding: '0 14px',
            background: 'var(--primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontFamily: 'inherit',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          + {t('monitors.addMonitor')}
        </button>
      </div>

      {/* Summary bar */}
      <MonitorSummaryBar monitors={monitors} />

      {/* Monitor grid */}
      <MonitorGrid
        monitors={monitors}
        isLoading={isLoading}
        onEdit={handleEdit}
        onToggle={handleToggle}
        onDelete={handleDelete}
      />

      {/* Create / Edit modal */}
      {modal.type !== 'closed' && (
        <MonitorModal
          monitor={modal.type === 'edit' ? modal.monitor : null}
          isLoading={createMutation.isPending || updateMutation.isPending}
          onSubmit={handleModalSubmit}
          onClose={() => setModal({ type: 'closed' })}
        />
      )}
    </div>
  )
}
