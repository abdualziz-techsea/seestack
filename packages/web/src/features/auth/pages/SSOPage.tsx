import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Formik, Form, Field } from 'formik'
import { z } from 'zod'
import { Shield } from 'lucide-react'
import { zodValidate } from '../utils/zodValidate'

const schema = z.object({ email: z.string().email('Invalid email') })

export function SSOPage() {
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'var(--primary-ghost)', color: 'var(--primary)' }}>
          <Shield size={24} />
        </div>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Single Sign-On</h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>Sign in with your corporate identity provider</p>
      </div>
      <Formik initialValues={{ email: '' }} validate={zodValidate(schema)} onSubmit={async () => {}}>
        {({ errors, touched, isSubmitting }) => (
          <Form className="space-y-4">
            <div>
              <label className="mb-1 block text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{t('auth.email')}</label>
              <Field name="email" type="email" placeholder="you@company.com" className="w-full rounded-lg border px-3 py-2 text-[13px] outline-none focus:border-[var(--primary)]" style={{ background: 'var(--bg-elevated)', borderColor: errors.email && touched.email ? 'var(--danger)' : 'var(--border)', color: 'var(--text-primary)' }} />
              {errors.email && touched.email && <p className="mt-1 text-[12px]" style={{ color: 'var(--danger)' }}>{errors.email}</p>}
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full rounded-lg py-2.5 text-[13px] font-medium disabled:opacity-50" style={{ background: 'var(--primary)', color: 'var(--bg-base)' }}>
              Continue with SSO
            </button>
            <div className="text-center">
              <Link to="/login" className="text-[13px] hover:underline" style={{ color: 'var(--text-secondary)' }}>Back to login</Link>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  )
}
