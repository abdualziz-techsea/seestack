import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Formik, Form, Field } from 'formik'
import { z } from 'zod'
import { Eye, EyeOff, CheckCircle } from 'lucide-react'
import { PasswordStrengthBar } from '../components/PasswordStrengthBar'
import { zodValidate } from '../utils/zodValidate'

const schema = z.object({
  password: z.string().min(8, 'Minimum 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })

export function ResetPasswordPage() {
  const { t } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)
  const [done, setDone] = useState(false)

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'var(--success-ghost)', color: 'var(--success)' }}>
          <CheckCircle size={24} />
        </div>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Password reset</h1>
        <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>Your password has been updated successfully.</p>
        <Link to="/login" className="inline-block rounded-lg px-6 py-2.5 text-[13px] font-medium" style={{ background: 'var(--primary)', color: 'var(--bg-base)' }}>
          {t('auth.signIn')}
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Set new password</h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>Must be at least 8 characters</p>
      </div>
      <Formik initialValues={{ password: '', confirmPassword: '' }} validate={zodValidate(schema)} onSubmit={async () => { setDone(true) }}>
        {({ errors, touched, values, isSubmitting }) => (
          <Form className="space-y-4">
            <div>
              <label className="mb-1 block text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>New password</label>
              <div className="relative">
                <Field name="password" type={showPassword ? 'text' : 'password'} className="w-full rounded-lg border px-3 py-2 pe-10 text-[13px] outline-none focus:border-[var(--primary)]" style={{ background: 'var(--bg-elevated)', borderColor: errors.password && touched.password ? 'var(--danger)' : 'var(--border)', color: 'var(--text-primary)' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute end-2 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
              <PasswordStrengthBar password={values.password} />
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>Confirm password</label>
              <Field name="confirmPassword" type="password" className="w-full rounded-lg border px-3 py-2 text-[13px] outline-none focus:border-[var(--primary)]" style={{ background: 'var(--bg-elevated)', borderColor: errors.confirmPassword && touched.confirmPassword ? 'var(--danger)' : 'var(--border)', color: 'var(--text-primary)' }} />
              {errors.confirmPassword && touched.confirmPassword && <p className="mt-1 text-[12px]" style={{ color: 'var(--danger)' }}>{errors.confirmPassword}</p>}
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full rounded-lg py-2.5 text-[13px] font-medium disabled:opacity-50" style={{ background: 'var(--primary)', color: 'var(--bg-base)' }}>
              Reset password
            </button>
          </Form>
        )}
      </Formik>
    </div>
  )
}
