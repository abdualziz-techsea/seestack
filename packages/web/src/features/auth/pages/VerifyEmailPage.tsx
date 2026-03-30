import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail } from 'lucide-react'

export function VerifyEmailPage() {
  const { t } = useTranslation()
  return (
    <div className="space-y-4 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'var(--primary-ghost)', color: 'var(--primary)' }}>
        <Mail size={24} />
      </div>
      <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Check your email</h1>
      <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>We sent a verification link to your email address. Click the link to verify your account.</p>
      <button className="text-[13px] font-medium hover:underline" style={{ color: 'var(--primary-text)' }}>Resend email</button>
      <div>
        <Link to="/login" className="text-[13px] hover:underline" style={{ color: 'var(--text-secondary)' }}>Back to login</Link>
      </div>
    </div>
  )
}
