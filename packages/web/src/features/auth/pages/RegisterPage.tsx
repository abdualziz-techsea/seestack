import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Formik, Form, Field } from 'formik'
import { z } from 'zod'
import { PasswordStrengthBar } from '../components/PasswordStrengthBar'
import { useRegister } from '../hooks/useRegister'
import { zodValidate } from '../utils/zodValidate'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  orgName: z.string().min(2, 'Organization name must be at least 2 characters'),
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

export function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { register, isLoading, error: registerError } = useRegister()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [focusedField, setFocusedField] = useState('')

  const displayError = error || registerError

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
        {t('auth.createYourAccount')}
      </h1>
      <p
        className="mb-6 text-center text-[13px]"
        style={{ color: 'var(--text-secondary)' }}
      >
        {t('auth.registerSubtitle')}
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

      {/* OAuth buttons */}
      <button
        className="mb-2 flex w-full items-center justify-center gap-2 text-[13px] font-medium transition-colors hover:opacity-90"
        style={{
          height: 40,
          borderRadius: 6,
          background: 'var(--bg-raised)',
          border: '1px solid var(--border-strong)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
        </svg>
        {t('auth.continueGithub')}
      </button>
      <button
        className="flex w-full items-center justify-center gap-2 text-[13px] font-medium transition-colors hover:opacity-90"
        style={{
          height: 40,
          borderRadius: 6,
          background: 'var(--bg-raised)',
          border: '1px solid var(--border-strong)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 18 18">
          <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
          <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
          <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" />
          <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
        </svg>
        {t('auth.continueGoogle')}
      </button>

      {/* Divider */}
      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {t('auth.or')}
        </span>
        <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
      </div>

      <Formik
        initialValues={{ name: '', email: '', password: '', orgName: '' }}
        validate={zodValidate(registerSchema)}
        onSubmit={async (values, { setSubmitting }) => {
          setError('')
          try {
            await register(values)
            // useRegister navigates to /overview on success
          } catch (err: any) {
            setError(err.message || 'Registration failed')
          } finally {
            setSubmitting(false)
          }
        }}
      >
        {({ errors, touched, values, isSubmitting }) => {
          const submitting = isSubmitting || isLoading
          return (
            <Form>
              {/* Full name */}
              <div className="mb-3.5">
                <label className="mb-1.5 block text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                  {t('auth.name')} *
                </label>
                <Field
                  name="name"
                  placeholder={t('auth.namePlaceholder')}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField('')}
                  style={inputStyle(!!(errors.name && touched.name), focusedField === 'name')}
                />
                {errors.name && touched.name && (
                  <p className="mt-0.5 text-[11px]" style={{ color: 'var(--danger)' }}>{errors.name}</p>
                )}
              </div>

              {/* Work email */}
              <div className="mb-3.5">
                <label className="mb-1.5 block text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                  {t('auth.email')} *
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

              {/* Password */}
              <div className="mb-3.5">
                <label className="mb-1.5 block text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                  {t('auth.password')} *
                </label>
                <div className="relative">
                  <Field
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('auth.passwordPlaceholder')}
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
                <PasswordStrengthBar password={values.password} />
                {errors.password && touched.password && (
                  <p className="mt-0.5 text-[11px]" style={{ color: 'var(--danger)' }}>{errors.password}</p>
                )}
              </div>

              {/* Organization name */}
              <div className="mb-3.5">
                <label className="mb-1.5 block text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                  {t('auth.orgName')} *
                </label>
                <Field
                  name="orgName"
                  placeholder={t('auth.orgPlaceholder')}
                  onFocus={() => setFocusedField('orgName')}
                  onBlur={() => setFocusedField('')}
                  style={inputStyle(!!(errors.orgName && touched.orgName), focusedField === 'orgName')}
                />
                <p className="mt-0.5 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                  {t('auth.orgHelper')}
                </p>
                {errors.orgName && touched.orgName && (
                  <p className="mt-0.5 text-[11px]" style={{ color: 'var(--danger)' }}>{errors.orgName}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="mt-1 flex w-full items-center justify-center gap-2 text-[13px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
                {submitting ? t('auth.creating') : t('auth.createAccount') + ' \u2192'}
              </button>
            </Form>
          )
        }}
      </Formik>

      {/* Terms */}
      <p className="mt-4 text-center text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
        {t('auth.agreeTerms')}{' '}
        <a href="#" className="underline" style={{ color: 'var(--text-secondary)' }}>{t('auth.terms')}</a>{' '}
        {t('auth.and')}{' '}
        <a href="#" className="underline" style={{ color: 'var(--text-secondary)' }}>{t('auth.privacy')}</a>
      </p>

      {/* Footer link */}
      <div className="mt-6 text-center text-[13px]" style={{ color: 'var(--text-secondary)' }}>
        {t('auth.haveAccount')}{' '}
        <Link to="/login" className="font-medium hover:underline" style={{ color: 'var(--primary-text)' }}>
          {t('auth.signIn')} {'\u2192'}
        </Link>
      </div>
    </div>
  )
}
