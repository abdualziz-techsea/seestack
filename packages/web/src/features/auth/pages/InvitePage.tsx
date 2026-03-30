import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Users } from 'lucide-react'

export function InvitePage() {
  const { code } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="space-y-4 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'var(--primary-ghost)', color: 'var(--primary)' }}>
        <Users size={24} />
      </div>
      <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>You've been invited</h1>
      <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>Accept the invitation to join the workspace.</p>
      <button onClick={() => navigate('/overview')} className="w-full rounded-lg py-2.5 text-[13px] font-medium" style={{ background: 'var(--primary)', color: 'var(--bg-base)' }}>
        Accept invitation
      </button>
      <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
        {t('auth.noAccount')}{' '}
        <a href="/register" className="font-medium hover:underline" style={{ color: 'var(--primary-text)' }}>{t('auth.signUp')}</a>
      </p>
    </div>
  )
}
