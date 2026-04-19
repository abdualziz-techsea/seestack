import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Formik, Form, Field } from 'formik'
import { z } from 'zod'
import { useLogin } from '../hooks/useLogin'
import { zodValidate } from '../utils/zodValidate'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

const inputBase: React.CSSProperties = {
  width: '100%',
  height: 34,
  padding: '8px 12px',
  background: 'rgba(255,255,255,0.027)',
  borderRadius: 6,
  color: 'var(--text-primary)',
  fontFamily: 'inherit',
  fontSize: 14,
  outline: 'none',
  transition: 'border .12s, box-shadow .12s',
}

function inputStyle(hasError: boolean, isFocused: boolean): React.CSSProperties {
  return {
    ...inputBase,
    border: `1px solid ${hasError ? 'var(--danger)' : isFocused ? 'var(--primary)' : 'var(--border-strong)'}`,
    boxShadow: isFocused ? '0 0 0 2px var(--primary-glow)' : 'none',
  }
}

export function LoginPage() {
  const { t } = useTranslation()
  const { login, isLoading: loginLoading, error: loginError } = useLogin()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [focusedField, setFocusedField] = useState('')

  const displayError = error || loginError

  return (
    <div style={{ width: '100%', maxWidth: 400 }}>
      {/* Logo centered */}
      <div className="mb-8 flex justify-center">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="8" height="8" rx="2" fill="var(--primary)" />
          <rect x="13" y="3" width="8" height="8" rx="2" fill="var(--primary)" opacity=".6" />
          <rect x="3" y="13" width="8" height="8" rx="2" fill="var(--primary)" opacity=".6" />
          <rect x="13" y="13" width="8" height="8" rx="2" fill="var(--primary)" opacity=".3" />
        </svg>
      </div>

      <h1
        className="mb-1 text-center text-2xl font-semibold"
        style={{ color: 'var(--text-primary)', letterSpacing: '-0.022em' }}
      >
        {t('auth.welcomeBack')}
      </h1>
      <p
        className="mb-7 text-center text-[13px]"
        style={{ color: 'var(--text-secondary)' }}
      >
        {t('auth.signInSubtitle')}
      </p>

      {/* Error alert */}
      {displayError && (
        <div
          className="mb-4 flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-[13px]"
          style={{
            background: 'var(--danger-ghost)',
            color: 'var(--danger)',
            border: '1px solid rgba(247,95,95,0.12)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {displayError}
        </div>
      )}

      <Formik
        initialValues={{ email: '', password: '' }}
        validate={zodValidate(loginSchema)}
        onSubmit={async (values, { setSubmitting }) => {
          setError('')
          try {
            await login(values.email, values.password)
          } catch (err: any) {
            setError(err.message || t('auth.invalidCredentials'))
          } finally {
            setSubmitting(false)
          }
        }}
      >
        {({ errors, touched, isSubmitting }) => {
          const submitting = isSubmitting || loginLoading
          return (
            <Form>
              {/* Email field */}
              <div className="mb-3.5">
                <label className="mb-1.5 block text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                  {t('auth.email')}
                </label>
                <Field
                  name="email"
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField('')}
                  style={inputStyle(!!(errors.email && touched.email), focusedField === 'email')}
                />
                {errors.email && touched.email && (
                  <p className="mt-0.5 text-[11px]" style={{ color: 'var(--danger)' }}>{errors.email}</p>
                )}
              </div>

              {/* Password field */}
              <div className="mb-3.5">
                <label className="mb-1.5 block text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <Field
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('auth.passwordDots')}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField('')}
                    style={{
                      ...inputStyle(!!(errors.password && touched.password), focusedField === 'password'),
                      paddingInlineEnd: 48,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-2 top-1/2 -translate-y-1/2 rounded px-1.5 py-1 text-xs transition-colors hover:bg-[var(--bg-hover)]"
                    style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    {showPassword ? t('auth.hide') : t('auth.show')}
                  </button>
                </div>
                {errors.password && touched.password && (
                  <p className="mt-0.5 text-[11px]" style={{ color: 'var(--danger)' }}>{errors.password}</p>
                )}
              </div>

              <div className="mb-4" />

              {/* Submit button */}
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 text-[13px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  height: 40,
                  borderRadius: 6,
                  background: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
                {submitting ? t('auth.signingIn') : t('auth.signIn')}
              </button>

              <div className="mt-6 text-center text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                Don’t have an account?{' '}
                <Link to="/register" className="font-medium hover:underline" style={{ color: 'var(--primary-text)' }}>
                  Create account {'\u2192'}
                </Link>
              </div>
            </Form>
          )
        }}
      </Formik>
    </div>
  )
}
