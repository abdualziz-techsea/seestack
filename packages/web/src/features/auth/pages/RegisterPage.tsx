import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Formik, Form, Field } from 'formik'
import { z } from 'zod'
import { useLogin } from '../hooks/useLogin'
import { zodValidate } from '../utils/zodValidate'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'At least 8 characters'),
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

function inputStyle(hasError: boolean, focused: boolean): React.CSSProperties {
  return {
    ...inputBase,
    border: `1px solid ${hasError ? 'var(--danger)' : focused ? 'var(--primary)' : 'var(--border-strong)'}`,
    boxShadow: focused ? '0 0 0 2px var(--primary-glow)' : 'none',
  }
}

export function RegisterPage() {
  const { register, isLoading, error: apiError } = useLogin()
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [focused, setFocused] = useState('')
  const displayError = error || apiError

  return (
    <div style={{ width: '100%', maxWidth: 400 }}>
      <div className="mb-8 flex justify-center">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="8" height="8" rx="2" fill="var(--primary)" />
          <rect x="13" y="3" width="8" height="8" rx="2" fill="var(--primary)" opacity=".6" />
          <rect x="3" y="13" width="8" height="8" rx="2" fill="var(--primary)" opacity=".6" />
          <rect x="13" y="13" width="8" height="8" rx="2" fill="var(--primary)" opacity=".3" />
        </svg>
      </div>

      <h1 className="mb-1 text-center text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
        Create your account
      </h1>
      <p className="mb-7 text-center text-[13px]" style={{ color: 'var(--text-secondary)' }}>
        Start monitoring errors and websites
      </p>

      {displayError && (
        <div
          className="mb-4 rounded-lg px-3.5 py-2.5 text-[13px]"
          style={{ background: 'var(--danger-ghost)', color: 'var(--danger)', border: '1px solid rgba(247,95,95,0.12)' }}
        >
          {displayError}
        </div>
      )}

      <Formik
        initialValues={{ name: '', email: '', password: '' }}
        validate={zodValidate(schema)}
        onSubmit={async (values, { setSubmitting }) => {
          setError('')
          try {
            await register(values.email, values.password, values.name)
          } catch (err: any) {
            setError(err.message || 'Registration failed')
          } finally {
            setSubmitting(false)
          }
        }}
      >
        {({ errors, touched, isSubmitting }) => {
          const submitting = isSubmitting || isLoading
          return (
            <Form>
              <div className="mb-3.5">
                <label className="mb-1.5 block text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>Name</label>
                <Field
                  name="name"
                  type="text"
                  placeholder="Ada Lovelace"
                  onFocus={() => setFocused('name')}
                  onBlur={() => setFocused('')}
                  style={inputStyle(!!(errors.name && touched.name), focused === 'name')}
                />
                {errors.name && touched.name && (
                  <p className="mt-0.5 text-[11px]" style={{ color: 'var(--danger)' }}>{errors.name}</p>
                )}
              </div>

              <div className="mb-3.5">
                <label className="mb-1.5 block text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>Email</label>
                <Field
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused('')}
                  style={inputStyle(!!(errors.email && touched.email), focused === 'email')}
                />
                {errors.email && touched.email && (
                  <p className="mt-0.5 text-[11px]" style={{ color: 'var(--danger)' }}>{errors.email}</p>
                )}
              </div>

              <div className="mb-4">
                <label className="mb-1.5 block text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>Password</label>
                <div className="relative">
                  <Field
                    name="password"
                    type={showPw ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused('')}
                    style={{ ...inputStyle(!!(errors.password && touched.password), focused === 'password'), paddingInlineEnd: 48 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute end-2 top-1/2 -translate-y-1/2 rounded px-1.5 py-1 text-xs"
                    style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none' }}
                  >
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                </div>
                {errors.password && touched.password && (
                  <p className="mt-0.5 text-[11px]" style={{ color: 'var(--danger)' }}>{errors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 text-[13px] font-medium disabled:opacity-40"
                style={{ height: 40, borderRadius: 6, background: 'var(--primary)', color: '#fff', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer' }}
              >
                {submitting ? 'Creating account…' : 'Create account'}
              </button>

              <div className="mt-6 text-center text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                Already have an account?{' '}
                <Link to="/login" className="font-medium hover:underline" style={{ color: 'var(--primary-text)' }}>
                  Sign in {'\u2192'}
                </Link>
              </div>
            </Form>
          )
        }}
      </Formik>
    </div>
  )
}
