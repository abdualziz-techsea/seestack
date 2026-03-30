import { useTranslation } from 'react-i18next'

interface LiveTailBarProps {
  visible: boolean
  isPaused: boolean
  isConnected: boolean
  logCount: number
  onPauseToggle: () => void
  onClear: () => void
}

export function LiveTailBar({
  visible,
  isPaused,
  isConnected,
  logCount,
  onPauseToggle,
  onClear,
}: LiveTailBarProps) {
  const { t } = useTranslation()

  if (!visible) return null

  const statusText = !isConnected
    ? t('logs.liveTailConnecting', { defaultValue: 'Connecting\u2026' })
    : isPaused
      ? t('logs.liveTailPaused')
      : t('logs.liveTailStreaming')

  return (
    <div
      style={{
        height: 36,
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 10,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: !isConnected
            ? 'var(--warning)'
            : isPaused
              ? 'var(--text-tertiary)'
              : 'var(--success)',
          animation: !isPaused && isConnected ? 'pulse 1.5s infinite' : 'none',
        }}
      />
      <span
        style={{
          fontSize: 12,
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {statusText}
      </span>
      {isConnected && !isPaused && logCount > 0 && (
        <span
          style={{
            fontSize: 11,
            color: 'var(--text-tertiary)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          ({logCount} {t('logs.logsReceived', { defaultValue: 'received' })})
        </span>
      )}
      <span style={{ flex: 1 }} />
      <button
        onClick={onPauseToggle}
        disabled={!isConnected}
        style={{
          height: 24,
          padding: '0 10px',
          border: '1px solid var(--border-strong)',
          borderRadius: 4,
          background: 'transparent',
          color: !isConnected ? 'var(--text-disabled)' : 'var(--text-secondary)',
          fontFamily: 'inherit',
          fontSize: 11,
          fontWeight: 500,
          cursor: isConnected ? 'pointer' : 'default',
          transition: 'all 0.12s',
        }}
        onMouseEnter={(e) => {
          if (isConnected) {
            e.currentTarget.style.background = 'var(--bg-hover)'
            e.currentTarget.style.color = 'var(--text-primary)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = isConnected ? 'var(--text-secondary)' : 'var(--text-disabled)'
        }}
      >
        {isPaused ? t('logs.resume') : t('logs.pause')}
      </button>
      <button
        onClick={onClear}
        style={{
          height: 24,
          padding: '0 10px',
          border: '1px solid var(--border-strong)',
          borderRadius: 4,
          background: 'transparent',
          color: 'var(--text-secondary)',
          fontFamily: 'inherit',
          fontSize: 11,
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.12s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--bg-hover)'
          e.currentTarget.style.color = 'var(--text-primary)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--text-secondary)'
        }}
      >
        {t('logs.clear')}
      </button>
    </div>
  )
}
