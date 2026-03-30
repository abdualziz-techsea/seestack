import { useTranslation } from 'react-i18next'
import { Formik, Form, Field } from 'formik'
import { z } from 'zod'
import { X } from 'lucide-react'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  platform: z.string().min(1, 'Platform is required'),
  description: z.string().optional(),
})

function validate(values: Record<string, unknown>) {
  const result = schema.safeParse(values)
  if (result.success) return {}
  const errors: Record<string, string> = {}
  for (const issue of result.error.issues) errors[issue.path.join('.')] = issue.message
  return errors
}

const platforms = [
  { value: 'node', label: 'Node.js' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'go', label: 'Go' },
  { value: 'dotnet', label: '.NET' },
  { value: 'ruby', label: 'Ruby' },
]

interface CreateProjectModalProps {
  onClose: () => void
}

export function CreateProjectModal({ onClose }: CreateProjectModalProps) {
  const { t } = useTranslation()

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div
        className="animate-scale-in fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border p-6 shadow-2xl"
        style={{ background: 'var(--bg-overlay)', borderColor: 'var(--border)' }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            {t('projects.createProject')}
          </h2>
          <button onClick={onClose} className="rounded p-1 transition-colors hover:bg-[var(--bg-hover)]" style={{ color: 'var(--text-tertiary)' }}>
            <X size={16} />
          </button>
        </div>

        <Formik
          initialValues={{ name: '', platform: 'node', description: '' }}
          validate={validate}
          onSubmit={async (_values, { setSubmitting }) => {
            try {
              // API call would go here
              onClose()
            } finally {
              setSubmitting(false)
            }
          }}
        >
          {({ errors, touched, values, setFieldValue, isSubmitting }) => (
            <Form className="space-y-4">
              <div>
                <label className="mb-1 block text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                  {t('projects.name')}
                </label>
                <Field
                  name="name"
                  placeholder={t('projects.namePlaceholder', { defaultValue: 'My App' })}
                  className="w-full rounded-lg border px-3 py-2 text-[13px] outline-none transition-colors focus:border-[var(--primary)]"
                  style={{
                    background: 'var(--bg-elevated)',
                    borderColor: errors.name && touched.name ? 'var(--danger)' : 'var(--border)',
                    color: 'var(--text-primary)',
                  }}
                />
                {errors.name && touched.name && (
                  <p className="mt-1 text-[12px]" style={{ color: 'var(--danger)' }}>{errors.name}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                  {t('projects.platform')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {platforms.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setFieldValue('platform', p.value)}
                      className="rounded-lg border px-3 py-2 text-[13px] transition-colors"
                      style={{
                        borderColor: values.platform === p.value ? 'var(--primary)' : 'var(--border)',
                        background: values.platform === p.value ? 'var(--primary-ghost)' : 'transparent',
                        color: values.platform === p.value ? 'var(--primary-text)' : 'var(--text-secondary)',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                  {t('projects.description')}
                </label>
                <Field
                  as="textarea"
                  name="description"
                  rows={3}
                  placeholder={t('projects.descriptionPlaceholder', { defaultValue: 'Brief description (optional)' })}
                  className="w-full resize-none rounded-lg border px-3 py-2 text-[13px] outline-none transition-colors focus:border-[var(--primary)]"
                  style={{
                    background: 'var(--bg-elevated)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-press flex-1 rounded-lg border py-2.5 text-[13px] font-medium"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-press flex-1 rounded-lg py-2.5 text-[13px] font-medium disabled:opacity-50"
                  style={{ background: 'var(--primary)', color: 'var(--bg-base)' }}
                >
                  {isSubmitting ? t('common.loading') : t('projects.createProject')}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </>
  )
}
