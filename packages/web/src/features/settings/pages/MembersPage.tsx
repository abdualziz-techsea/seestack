import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { useMembers } from '../hooks/useMembers'

const roleColors: Record<string, { bg: string; color: string }> = {
  owner: { bg: 'var(--primary-ghost)', color: 'var(--primary-text)' },
  admin: { bg: 'var(--warning-ghost)', color: 'var(--warning)' },
  member: { bg: 'var(--bg-elevated)', color: 'var(--text-secondary)' },
}

export function MembersPage() {
  const { t } = useTranslation()
  const [showInvite, setShowInvite] = useState(false)
  const { members, isLoading } = useMembers()

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{t('nav.members')}</h1>
        <button onClick={() => setShowInvite(true)} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium" style={{ background: 'var(--primary)', color: 'var(--bg-base)' }}>
          <Plus size={14} /> {t('common.invite')}
        </button>
      </div>

      <div className="overflow-hidden border" style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)', borderRadius: 'var(--radius-xl)' }}>
        {isLoading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}><SkeletonRow /></div>
        ))}
        {members.map((member: any) => (
          <div key={member.id} className="flex items-center gap-3 border-b px-4 py-3 transition-colors hover:bg-[var(--bg-hover)]" style={{ borderColor: 'var(--border)' }}>
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-medium" style={{ background: 'var(--primary-ghost)', color: 'var(--primary-text)' }}>
              {member.avatarInitials ?? member.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{member.name}</div>
              <div className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>{member.email}</div>
            </div>
            <span className="rounded px-2 py-0.5 text-[11px] font-medium" style={{ background: roleColors[member.role]?.bg, color: roleColors[member.role]?.color }}>{member.role}</span>
            {member.role !== 'owner' && (
              <select className="rounded-md border px-2 py-1 text-[12px] outline-none" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} defaultValue={member.role}>
                <option value="admin">Admin</option>
                <option value="member">Member</option>
              </select>
            )}
            {member.role !== 'owner' && (
              <button className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-[var(--bg-hover)]" style={{ color: 'var(--text-tertiary)' }}>
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
        {!isLoading && members.length === 0 && (
          <div className="py-8 text-center text-[13px]" style={{ color: 'var(--text-tertiary)' }}>{t('empty.noMembers')}</div>
        )}
      </div>

      {/* Invite dialog */}
      {showInvite && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setShowInvite(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border p-6 shadow-2xl" style={{ background: 'var(--bg-overlay)', borderColor: 'var(--border)' }}>
            <h3 className="mb-4 text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>Invite member</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{t('auth.email')}</label>
                <input placeholder="colleague@company.com" className="w-full rounded-lg border px-3 py-2 text-[13px] outline-none focus:border-[var(--primary)]" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>Role</label>
                <select className="w-full rounded-lg border px-3 py-2 text-[13px] outline-none" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                  <option value="admin">Admin — full access</option>
                  <option value="member">Member — limited access</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowInvite(false)} className="flex-1 rounded-lg border py-2.5 text-[13px] font-medium" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>{t('common.cancel')}</button>
                <button className="flex-1 rounded-lg py-2.5 text-[13px] font-medium" style={{ background: 'var(--primary)', color: 'var(--bg-base)' }}>{t('common.invite')}</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
