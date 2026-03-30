import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Formik, Form, Field } from 'formik'
import { z } from 'zod'
import { AlertTriangle, Download } from 'lucide-react'
import { useOrgSettings } from '../hooks/useOrgSettings'
import { useUpdateSettings } from '../hooks/useUpdateSettings'

function zodValidate(schema: z.ZodType) {
  return (values: Record<string, unknown>) => {
    const result = schema.safeParse(values)
    if (result.success) return {}
    const errors: Record<string, string> = {}
    for (const issue of result.error.issues) errors[issue.path.join('.')] = issue.message
    return errors
  }
}

const settingsSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  slug: z.string().min(2, 'Slug is required'),
  timezone: z.string(),
})

export function GeneralSettingsPage() {
  const { t } = useTranslation()
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const { settings } = useOrgSettings()
  const { update } = useUpdateSettings()

  const orgSlug = settings?.slug ?? ''

  const handleSave = async (values: Record<string, unknown>) => {
    setSaveState('saving')
    try {
      await update({ name: values.name, slug: values.slug })
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    } catch {
      setSaveState('idle')
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{t('nav.settings')}</h1>

      <Formik
        enableReinitialize
        initialValues={{ name: settings?.name ?? '', slug: settings?.slug ?? '', timezone: 'Asia/Riyadh' }}
        validate={zodValidate(settingsSchema)}
        onSubmit={handleSave}
      >
        {({ errors, touched }) => (
          <Form className="space-y-4 border p-6" style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)', borderRadius: 'var(--radius-xl)' }}>
            <div>
              <label className="mb-1 block text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{t('settings.workspaceName')}</label>
              <Field name="name" className="w-full rounded-lg border px-3 py-2 text-[13px] outline-none focus:border-[var(--primary)]" style={{ background: 'var(--bg-elevated)', borderColor: errors.name && touched.name ? 'var(--danger)' : 'var(--border)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{t('settings.workspaceUrl')}</label>
              <div className="flex items-center rounded-lg border text-[13px]" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                <span className="px-3" style={{ color: 'var(--text-tertiary)' }}>allstak.io/</span>
                <Field name="slug" className="flex-1 bg-transparent px-1 py-2 outline-none" style={{ color: 'var(--text-primary)' }} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{t('settings.timezone')}</label>
              <Field as="select" name="timezone" className="w-full rounded-lg border px-3 py-2 text-[13px] outline-none" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                <option value="Asia/Riyadh">Asia/Riyadh (UTC+3)</option>
                <option value="America/New_York">America/New_York (UTC-5)</option>
                <option value="Europe/London">Europe/London (UTC+0)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
              </Field>
            </div>
            <button
              type="submit"
              disabled={saveState !== 'idle'}
              className="rounded-lg px-4 py-2 text-[13px] font-medium transition-all"
              style={{
                background: saveState === 'saved' ? 'var(--success-ghost)' : 'var(--primary)',
                color: saveState === 'saved' ? 'var(--success)' : 'var(--bg-base)',
              }}
            >
              {saveState === 'saving' ? t('common.saving') : saveState === 'saved' ? t('common.saved') + ' ✓' : t('common.save')}
            </button>
          </Form>
        )}
      </Formik>

      {/* Danger zone */}
      <div className="border p-6" style={{ borderColor: 'var(--danger)', background: 'var(--bg-raised)', borderRadius: 'var(--radius-xl)' }}>
        <h3 className="flex items-center gap-2 text-[14px] font-semibold" style={{ color: 'var(--danger)' }}>
          <AlertTriangle size={16} /> {t('settings.dangerZone')}
        </h3>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <div className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{t('settings.exportData')}</div>
            <div className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>{t('settings.exportDesc')}</div>
          </div>
          <button className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-medium" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            <Download size={14} /> {t('settings.exportAction')}
          </button>
        </div>
        <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{t('settings.deleteWorkspace')}</div>
              <div className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>{t('settings.deleteDesc')}</div>
            </div>
            <button onClick={() => setShowDeleteDialog(true)} className="rounded-lg px-3 py-1.5 text-[13px] font-medium" style={{ background: 'var(--danger-ghost)', color: 'var(--danger)' }}>
              {t('common.delete')}
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteDialog && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setShowDeleteDialog(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border p-6 shadow-2xl" style={{ background: 'var(--bg-overlay)', borderColor: 'var(--border)' }}>
            <h3 className="text-[15px] font-semibold" style={{ color: 'var(--danger)' }}>{t('settings.deleteWorkspace')}</h3>
            <p className="mt-2 text-[13px]" style={{ color: 'var(--text-secondary)' }}>{t('settings.deleteDialogDesc')}</p>
            <div className="mt-4">
              <label className="mb-1 block text-[13px]" style={{ color: 'var(--text-secondary)' }}>Type <strong>delete {orgSlug}</strong> to confirm</label>
              <input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-[13px] outline-none" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={() => { setShowDeleteDialog(false); setDeleteConfirm('') }} className="flex-1 rounded-lg border py-2 text-[13px] font-medium" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>{t('common.cancel')}</button>
              <button disabled={deleteConfirm !== `delete ${orgSlug}`} className="flex-1 rounded-lg py-2 text-[13px] font-medium disabled:opacity-30" style={{ background: 'var(--danger)', color: 'white' }}>{t('common.delete')}</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
