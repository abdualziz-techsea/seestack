import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Formik, Form, Field } from 'formik'
import { z } from 'zod'
import { ArrowLeft, Mail } from 'lucide-react'
import { zodValidate } from '../utils/zodValidate'

const schema = z.object({ email: z.string().email('Invalid email') })

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [sent, setSent] = useState(false)

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'var(--primary-ghost)', color: 'var(--primary)' }}>
          <Mail size={24} />
        </div>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Check your email</h1>
        <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>We sent a password reset link to your email.</p>
        <Link to="/login" className="inline-flex items-center gap-1 text-[13px] font-medium hover:underline" style={{ color: 'var(--primary-text)' }}>
          <ArrowLeft size={14} /> Back to login
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{t('auth.forgotPassword')}</h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>Enter your email and we'll send a reset link</p>
      </div>
      <Formik initialValues={{ email: '' }} validate={zodValidate(schema)} onSubmit={async () => { setSent(true) }}>
        {({ errors, touched, isSubmitting }) => (
          <Form className="space-y-4">
            <div>
              <label className="mb-1 block text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{t('auth.email')}</label>
              <Field name="email" type="email" className="w-full rounded-lg border px-3 py-2 text-[13px] outline-none focus:border-[var(--primary)]" style={{ background: 'var(--bg-elevated)', borderColor: errors.email && touched.email ? 'var(--danger)' : 'var(--border)', color: 'var(--text-primary)' }} />
              {errors.email && touched.email && <p className="mt-1 text-[12px]" style={{ color: 'var(--danger)' }}>{errors.email}</p>}
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full rounded-lg py-2.5 text-[13px] font-medium disabled:opacity-50" style={{ background: 'var(--primary)', color: 'var(--bg-base)' }}>
              Send reset link
            </button>
            <div className="text-center">
              <Link to="/login" className="inline-flex items-center gap-1 text-[13px] hover:underline" style={{ color: 'var(--text-secondary)' }}>
                <ArrowLeft size={14} /> Back to login
              </Link>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  )
}
