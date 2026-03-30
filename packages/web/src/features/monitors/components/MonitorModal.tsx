import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { Monitor } from '@allstak/shared'

interface MonitorModalProps {
  monitor?: Monitor | null
  isLoading: boolean
  onSubmit: (data: { name: string; url: string; intervalMinutes: number }) => Promise<void>
  onClose: () => void
}

export function MonitorModal({ monitor, isLoading, onSubmit, onClose }: MonitorModalProps) {
  const { t } = useTranslation()
  const isEdit = !!monitor
  const [url, setUrl] = useState(monitor?.url ?? '')
  const [name, setName] = useState(monitor?.name ?? '')
  const [interval, setInterval] = useState(monitor?.intervalMinutes ?? 5)
  const [error, setError] = useState('')

  // Animation state
  const [visible, setVisible] = useState(false)
  const closingRef = useRef(false)

  useEffect(() => {
    // Trigger enter animation on next frame
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const handleClose = () => {
    if (closingRef.current) return
    closingRef.current = true
    setVisible(false)
    setTimeout(onClose, 200)
  }

  const handleSubmit = async () => {
    if (!url.trim() || !name.trim()) {
      setError(t('monitors.validationRequired'))
      return
    }
    if (!/^https?:\/\/.+/.test(url)) {
      setError(t('monitors.validationUrl'))
      return
    }
    setError('')
    try {
      await onSubmit({ name, url, intervalMinutes: interval })
      closingRef.current = true
      setVisible(false)
      setTimeout(onClose, 200)
    } catch {
      setError(isEdit ? t('monitors.updateError', { defaultValue: 'Failed to update monitor' }) : t('monitors.createError'))
    }
  }

  const title = isEdit ? t('monitors.editMonitor', { defaultValue: 'Edit monitor' }) : t('monitors.addMonitor')
  const submitLabel = isEdit
    ? isLoading ? t('common.saving') : t('monitors.saveMonitor', { defaultValue: 'Save changes' })
    : isLoading ? t('common.creating', { defaultValue: 'Creating...' }) : t('monitors.addMonitor')

  return (
    <>
      {/* Overlay with fade */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.2s ease-out',
        }}
      >
        {/* Modal with scale + fade */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: 12,
            width: 440,
            maxWidth: '90vw',
            padding: 24,
            transform: visible ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(8px)',
            opacity: visible ? 1 : 0,
            transition: 'transform 0.2s ease-out, opacity 0.2s ease-out',
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, letterSpacing: '-0.015em' }}>
            {title}
          </h2>

          {/* URL field */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }}>
              URL
            </label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.example.com/health"
              style={{
                width: '100%',
                height: 34,
                padding: '0 10px',
                background: 'var(--bg-raised)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>

          {/* Name field */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }}>
              {t('monitors.name')}
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('monitors.namePlaceholder')}
              style={{
                width: '100%',
                height: 34,
                padding: '0 10px',
                background: 'var(--bg-raised)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>

          {/* Interval pills */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }}>
              {t('monitors.checkInterval')}
            </label>
            <div style={{ display: 'flex', border: '1px solid var(--border-strong)', borderRadius: 6, overflow: 'hidden' }}>
              {[1, 5, 10].map((m, i) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setInterval(m)}
                  style={{
                    padding: '6px 14px',
                    fontSize: 12,
                    fontWeight: 500,
                    background: interval === m ? 'var(--primary-ghost)' : 'transparent',
                    color: interval === m ? 'var(--primary-text)' : 'var(--text-secondary)',
                    border: 'none',
                    borderLeft: i > 0 ? '1px solid var(--border-strong)' : 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {m}{t('monitors.minuteShort', { defaultValue: 'min' })}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 10 }}>{error}</div>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <button
              type="button"
              onClick={handleClose}
              style={{
                height: 32,
                padding: '0 14px',
                background: 'transparent',
                border: '1px solid var(--border-strong)',
                borderRadius: 6,
                color: 'var(--text-secondary)',
                fontFamily: 'inherit',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              style={{
                height: 32,
                padding: '0 14px',
                background: 'var(--primary)',
                border: 'none',
                borderRadius: 6,
                color: '#fff',
                fontFamily: 'inherit',
                fontSize: 12,
                fontWeight: 500,
                cursor: isLoading ? 'default' : 'pointer',
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              {submitLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
