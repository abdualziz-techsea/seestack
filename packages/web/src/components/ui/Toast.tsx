import { useState, useEffect } from 'react'

type ToastVariant = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  variant: ToastVariant
  message: string
  onClose?: () => void
  duration?: number
}

const icons: Record<ToastVariant, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
}

const colors: Record<ToastVariant, string> = {
  success: 'var(--success)',
  error: 'var(--danger)',
  warning: 'var(--warning)',
  info: 'var(--info)',
}

export function Toast({ variant, message, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => onClose?.(), duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 16px',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-overlay)',
        border: '1px solid var(--border-strong)',
        fontSize: 'var(--text-base)',
        minWidth: 280,
        boxShadow: 'var(--shadow-lg)',
        animation: 'toast-in 0.25s var(--ease-out)',
      }}
    >
      <span style={{ fontSize: 15, flexShrink: 0, color: colors[variant] }}>{icons[variant]}</span>
      <span style={{ flex: 1, color: 'var(--text-primary)' }}>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            color: 'var(--text-disabled)',
            cursor: 'pointer',
            fontSize: 14,
            padding: 2,
            borderRadius: 'var(--radius-xs)',
            transition: 'color var(--duration-fast)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-disabled)' }}
        >
          ✕
        </button>
      )}
    </div>
  )
}
