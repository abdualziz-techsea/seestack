import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Info, Copy, CheckCircle, Trash2 } from 'lucide-react'
import { CopyButton } from '@/components/shared/CopyButton'
import { TimeAgo } from '@/components/shared/TimeAgo'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from '../hooks/useApiKeys'

export function ApiKeysPage() {
  const { t } = useTranslation()
  const [showCreate, setShowCreate] = useState(false)
  const [keyName, setKeyName] = useState('')
  const [newKey, setNewKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [showRevoke, setShowRevoke] = useState<string | null>(null)
  const { keys, isLoading } = useApiKeys()
  const createMutation = useCreateApiKey()
  const revokeMutation = useRevokeApiKey()

  const handleCreate = async () => {
    if (!keyName.trim()) return
    try {
      const result = await createMutation.mutateAsync({ name: keyName.trim() })
      setNewKey(result.key ?? null)
      setKeyName('')
    } catch {}
  }

  const handleRevoke = async () => {
    if (!showRevoke) return
    try {
      await revokeMutation.mutateAsync(showRevoke)
      setShowRevoke(null)
    } catch {}
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{t('nav.apiKeys')}</h1>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium" style={{ background: 'var(--primary)', color: 'var(--bg-base)' }}>
          <Plus size={14} /> {t('apiKeys.createTitle')}
        </button>
      </div>

      <div className="flex items-start gap-2 rounded-lg border p-3" style={{ borderColor: 'var(--border-accent)', background: 'var(--primary-ghost)' }}>
        <Info size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--primary)' }} />
        <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>{t('apiKeys.securityNote')}</p>
      </div>

      <div className="overflow-hidden border" style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)', borderRadius: 'var(--radius-xl)' }}>
        <table className="w-full">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
              <th className="px-4 py-2 text-start text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{t('apiKeys.nameCol')}</th>
              <th className="px-3 py-2 text-start text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{t('apiKeys.keyCol')}</th>
              <th className="px-3 py-2 text-end text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{t('apiKeys.lastUsedCol')}</th>
              <th className="w-16 px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 2 }).map((_, i) => (
              <tr key={i}><td colSpan={4} className="px-3 py-3"><SkeletonRow /></td></tr>
            ))}
            {keys.map((key: any) => (
              <tr key={key.id} className="border-b transition-colors hover:bg-[var(--bg-hover)]" style={{ borderColor: 'var(--border)' }}>
                <td className="px-4 py-3">
                  <div className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{key.name}</div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    <code className="text-[12px] font-mono" style={{ color: 'var(--text-secondary)' }}>{key.keyPrefix ?? '••••••••'}</code>
                    {key.keyPrefix && <CopyButton text={key.keyPrefix} />}
                  </div>
                </td>
                <td className="px-3 py-3 text-end text-[12px]">{key.lastUsedAt ? <TimeAgo date={key.lastUsedAt} /> : '—'}</td>
                <td className="px-3 py-3">
                  <button onClick={() => setShowRevoke(key.id)} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-[var(--bg-hover)]" style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && keys.length === 0 && (
          <div className="py-8 text-center text-[13px]" style={{ color: 'var(--text-tertiary)' }}>{t('empty.noApiKeys')}</div>
        )}
      </div>

      {/* Create key dialog */}
      {showCreate && !newKey && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setShowCreate(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border p-6 shadow-2xl" style={{ background: 'var(--bg-overlay)', borderColor: 'var(--border)' }}>
            <h3 className="mb-4 text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>{t('apiKeys.createTitle')}</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{t('apiKeys.keyNameLabel')}</label>
                <input
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder={t('apiKeys.namePlaceholder')}
                  className="w-full rounded-lg border px-3 py-2 text-[13px] outline-none focus:border-[var(--primary)]"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowCreate(false); setKeyName('') }} className="flex-1 rounded-lg border py-2.5 text-[13px] font-medium" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>{t('common.cancel')}</button>
                <button
                  onClick={handleCreate}
                  disabled={createMutation.isPending || !keyName.trim()}
                  className="flex-1 rounded-lg py-2.5 text-[13px] font-medium disabled:opacity-40"
                  style={{ background: 'var(--primary)', color: 'var(--bg-base)' }}
                >
                  {createMutation.isPending ? t('common.loading') : t('common.create')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* New key reveal dialog */}
      {newKey && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border p-6 shadow-2xl" style={{ background: 'var(--bg-overlay)', borderColor: 'var(--border)' }}>
            <h3 className="mb-2 text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>{t('apiKeys.newKeyTitle')}</h3>
            <div className="mb-3 flex items-center gap-2 rounded-lg p-2" style={{ background: 'var(--warning-ghost)' }}>
              <Info size={14} style={{ color: 'var(--warning)' }} />
              <span className="text-[12px]" style={{ color: 'var(--warning)' }}>{t('apiKeys.warningCopy')}</span>
            </div>
            <div className="rounded-lg p-3" style={{ background: 'var(--bg-base)' }}>
              <code className="block break-all text-[13px] font-mono" style={{ color: 'var(--success)' }}>{newKey}</code>
            </div>
            <button
              onClick={async () => { await navigator.clipboard.writeText(newKey); setCopied(true) }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-[13px] font-medium"
              style={{ background: copied ? 'var(--success-ghost)' : 'var(--primary)', color: copied ? 'var(--success)' : 'var(--bg-base)' }}
            >
              {copied ? <><CheckCircle size={14} /> {t('apiKeys.copiedBtn')}</> : <><Copy size={14} /> {t('apiKeys.copyToClipboard')}</>}
            </button>
            <label className="mt-3 flex items-center gap-2 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="rounded" />
              {t('apiKeys.confirmedMsg')}
            </label>
            <button
              disabled={!confirmed}
              onClick={() => { setNewKey(null); setShowCreate(false); setCopied(false); setConfirmed(false) }}
              className="mt-3 w-full rounded-lg py-2.5 text-[13px] font-medium disabled:opacity-30"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
            >
              {t('apiKeys.doneBtn')}
            </button>
          </div>
        </>
      )}

      {/* Revoke dialog */}
      {showRevoke && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setShowRevoke(null)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border p-6 shadow-2xl" style={{ background: 'var(--bg-overlay)', borderColor: 'var(--border)' }}>
            <h3 className="text-[15px] font-semibold" style={{ color: 'var(--danger)' }}>{t('apiKeys.revokeTitle')}</h3>
            <p className="mt-2 text-[13px]" style={{ color: 'var(--text-secondary)' }}>{t('apiKeys.revokeDesc')}</p>
            <div className="mt-4 flex gap-3">
              <button onClick={() => setShowRevoke(null)} className="flex-1 rounded-lg border py-2 text-[13px] font-medium" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>{t('common.cancel')}</button>
              <button
                onClick={handleRevoke}
                disabled={revokeMutation.isPending}
                className="flex-1 rounded-lg py-2 text-[13px] font-medium disabled:opacity-40"
                style={{ background: 'var(--danger)', color: 'white' }}
              >
                {revokeMutation.isPending ? t('common.loading') : t('common.revoke')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
