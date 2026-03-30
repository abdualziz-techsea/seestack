import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import { TimeAgo } from '@/components/shared/TimeAgo'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { useAlertRules } from '../hooks/useAlertRules'
import { useCreateAlertRule } from '../hooks/useCreateAlertRule'
import { alertsApi } from '@allstak/shared'
import { useAuthStore } from '@/store/auth.store'
import type { AlertRule } from '@allstak/shared'

const TRIGGER_TYPES = [
  'error_spike',
  'new_error',
  'monitor_down',
  'monitor_response_time',
  'ssh_session_started',
] as const

const CHANNEL_TYPES = ['slack', 'discord', 'email', 'push'] as const

export function AlertsPage() {
  const { t } = useTranslation()
  const currentProject = useAuthStore((s) => s.currentProject)
  const { rules, isLoading } = useAlertRules()
  const { createRule, isLoading: isCreating } = useCreateAlertRule()
  const queryClient = useQueryClient()

  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    name: '',
    triggerType: 'new_error',
    severityFilter: 'all',
    channelType: 'slack',
    webhookUrl: '',
    quietHoursEnabled: false,
    quietStart: '22:00',
    quietEnd: '08:00',
  })
  const [formError, setFormError] = useState('')

  const toggleMutation = useMutation({
    mutationFn: (id: string) => alertsApi.toggle(id, true),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alert-rules'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => alertsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alert-rules'] }),
  })

  const handleCreate = async () => {
    if (!currentProject?.id || !form.name.trim()) {
      setFormError('Name is required')
      return
    }
    if ((form.channelType === 'slack' || form.channelType === 'discord') && !form.webhookUrl.trim()) {
      setFormError('Webhook URL is required for Slack/Discord')
      return
    }
    setFormError('')
    try {
      await createRule({
        projectId: currentProject.id,
        name: form.name,
        triggerType: form.triggerType,
        triggerConfig: {},
        severityFilter: form.severityFilter,
        quietHoursEnabled: form.quietHoursEnabled,
        quietStart: form.quietStart,
        quietEnd: form.quietEnd,
        channels: [
          form.channelType === 'slack' || form.channelType === 'discord'
            ? { type: form.channelType, webhookUrl: form.webhookUrl }
            : { type: form.channelType },
        ],
      })
      setShowCreate(false)
      setForm({ name: '', triggerType: 'new_error', severityFilter: 'all', channelType: 'slack', webhookUrl: '', quietHoursEnabled: false, quietStart: '22:00', quietEnd: '08:00' })
    } catch (e: any) {
      setFormError(e?.message ?? 'Failed to create rule')
    }
  }

  const fieldStyle = {
    width: '100%', height: 34, padding: '0 10px',
    background: 'var(--bg-raised)', border: '1px solid var(--border-strong)',
    borderRadius: 6, color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: 13, outline: 'none',
  }
  const labelStyle = { display: 'block' as const, fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{t('nav.alerts')}</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium"
          style={{ background: 'var(--primary)', color: 'var(--bg-base)' }}
        >
          <Plus size={14} /> {t('common.create')} rule
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}>
          <div className="w-[480px] overflow-hidden rounded-2xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-strong)', boxShadow: 'var(--shadow-xl)' }}>
            <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Create Alert Rule</h2>
            </div>
            <div className="space-y-3 p-5">
              <div>
                <label style={labelStyle}>Rule name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="High error spike" style={fieldStyle} />
              </div>
              <div>
                <label style={labelStyle}>Trigger type</label>
                <select value={form.triggerType} onChange={(e) => setForm({ ...form, triggerType: e.target.value })} style={{ ...fieldStyle, height: 34 }}>
                  {TRIGGER_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Severity filter</label>
                <select value={form.severityFilter} onChange={(e) => setForm({ ...form, severityFilter: e.target.value })} style={{ ...fieldStyle, height: 34 }}>
                  <option value="all">All</option>
                  <option value="critical">Critical only</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Notification channel</label>
                <select value={form.channelType} onChange={(e) => setForm({ ...form, channelType: e.target.value })} style={{ ...fieldStyle, height: 34 }}>
                  {CHANNEL_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {(form.channelType === 'slack' || form.channelType === 'discord') && (
                <div>
                  <label style={labelStyle}>Webhook URL</label>
                  <input value={form.webhookUrl} onChange={(e) => setForm({ ...form, webhookUrl: e.target.value })} placeholder="https://hooks.slack.com/..." style={fieldStyle} />
                </div>
              )}
              {formError && <div className="text-[12px]" style={{ color: 'var(--danger)' }}>{formError}</div>}
            </div>
            <div className="flex justify-end gap-2 border-t px-5 py-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)' }}>
              <button onClick={() => { setShowCreate(false); setFormError('') }} className="rounded-md px-3 py-1.5 text-[13px] font-medium" style={{ color: 'var(--text-secondary)', background: 'var(--bg-raised)', border: '1px solid var(--border-strong)' }}>
                {t('common.cancel')}
              </button>
              <button onClick={handleCreate} disabled={isCreating || !form.name} className="rounded-md px-3 py-1.5 text-[13px] font-medium disabled:opacity-40" style={{ background: 'var(--primary)', color: '#fff' }}>
                {isCreating ? 'Creating...' : t('common.create')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden border" style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)', borderRadius: 'var(--radius-xl)' }}>
        <table className="w-full">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
              <th className="w-12 px-4 py-2"></th>
              <th className="px-3 py-2 text-start text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Rule</th>
              <th className="px-3 py-2 text-start text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Trigger</th>
              <th className="px-3 py-2 text-start text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Channels</th>
              <th className="px-3 py-2 text-start text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Severity</th>
              <th className="px-3 py-2 text-end text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Created</th>
              <th className="w-16 px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 3 }).map((_, i) => (
              <tr key={i}><td colSpan={7} className="px-3 py-3"><SkeletonRow /></td></tr>
            ))}
            {rules.map((rule: AlertRule) => (
              <tr key={rule.id} className="border-b transition-colors hover:bg-[var(--bg-hover)]" style={{ borderColor: 'var(--border)' }}>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleMutation.mutate(rule.id)}
                    disabled={toggleMutation.isPending}
                    className="relative h-5 w-9 rounded-full transition-colors"
                    style={{ background: rule.isEnabled ? 'var(--primary)' : 'var(--bg-elevated)' }}
                  >
                    <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform" style={{ transform: rule.isEnabled ? 'translateX(18px)' : 'translateX(2px)' }} />
                  </button>
                </td>
                <td className="px-3 py-3">
                  <span className="text-[13px] font-medium" style={{ color: rule.isEnabled ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{rule.name}</span>
                </td>
                <td className="px-3 py-3 text-[12px]" style={{ color: 'var(--text-secondary)' }}>{rule.triggerType.replace(/_/g, ' ')}</td>
                <td className="px-3 py-3">
                  <div className="flex gap-1">
                    {rule.channels.map((ch, idx) => (
                      <span key={idx} className="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                        {ch.type}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span className="rounded px-1.5 py-0.5 text-[11px] font-medium" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>{rule.severityFilter}</span>
                </td>
                <td className="px-3 py-3 text-end text-[12px]"><TimeAgo date={rule.createdAt} /></td>
                <td className="px-3 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => deleteMutation.mutate(rule.id)}
                      disabled={deleteMutation.isPending}
                      className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-[var(--bg-hover)]"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && rules.length === 0 && (
          <div className="py-12 text-center text-[13px]" style={{ color: 'var(--text-tertiary)' }}>{t('empty.noAlerts')}</div>
        )}
      </div>
    </div>
  )
}
