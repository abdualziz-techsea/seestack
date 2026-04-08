import { useEffect, useRef, useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// Moyasar JS SDK global — loaded from CDN
declare global {
  interface Window {
    Moyasar?: {
      init: (config: MoyasarConfig) => void
    }
  }
}

interface MoyasarConfig {
  element: string | HTMLElement
  amount: number
  currency: string
  description: string
  publishable_api_key: string
  callback_url: string
  methods: string[]
  supported_networks: string[]
  language?: string
  metadata?: Record<string, string>
  on_completed?: (payment: Record<string, unknown>) => void
}

interface Props {
  plan: string
  planLabel: string
  amountHalalas: number
  orgId: string
  onClose: () => void
}

const MOYASAR_JS  = 'https://cdn.moyasar.com/mpf/1.7.3/moyasar.js'
const MOYASAR_CSS = 'https://cdn.moyasar.com/mpf/1.7.3/moyasar.css'

export function PaymentModal({ plan, planLabel, amountHalalas, orgId, onClose }: Props) {
  const { t, i18n } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [sdkReady, setSdkReady] = useState(false)
  const [sdkError, setSdkError] = useState(false)
  const initDoneRef = useRef(false)

  // Detect language for Moyasar (ar or en)
  const lang = i18n.language.startsWith('ar') ? 'ar' : 'en'

  // Load Moyasar CSS once
  useEffect(() => {
    if (!document.querySelector(`link[href="${MOYASAR_CSS}"]`)) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = MOYASAR_CSS
      document.head.appendChild(link)
    }
  }, [])

  // Load Moyasar JS SDK
  useEffect(() => {
    if (window.Moyasar) {
      setSdkReady(true)
      return
    }
    if (document.querySelector(`script[src="${MOYASAR_JS}"]`)) {
      // Already loading — wait
      const interval = setInterval(() => {
        if (window.Moyasar) { setSdkReady(true); clearInterval(interval) }
      }, 100)
      return () => clearInterval(interval)
    }

    const script = document.createElement('script')
    script.src = MOYASAR_JS
    script.async = true
    script.onload = () => setSdkReady(true)
    script.onerror = (e) => {
      console.error('[Moyasar] Failed to load SDK from', MOYASAR_JS, e)
      setSdkError(true)
    }
    document.head.appendChild(script)
  }, [])

  // Initialize Moyasar form once SDK is ready and container is mounted
  useEffect(() => {
    if (!sdkReady || !window.Moyasar || !containerRef.current || initDoneRef.current) return
    initDoneRef.current = true

    const publicKey = import.meta.env.VITE_MOYASAR_PUBLIC_KEY as string
    if (!publicKey) {
      console.error('[Moyasar] VITE_MOYASAR_PUBLIC_KEY is not set. Restart the dev server after adding it to .env.development')
      setSdkError(true)
      return
    }

    const callbackUrl =
      `${window.location.origin}/billing?plan=${plan}&orgId=${orgId}`

    window.Moyasar.init({
      element: containerRef.current,
      amount: amountHalalas,
      currency: 'SAR',
      description: `SeeStack ${planLabel} Plan`,
      publishable_api_key: publicKey,
      callback_url: callbackUrl,
      methods: ['creditcard'],
      supported_networks: ['visa', 'mastercard', 'mada'],
      language: lang,
      metadata: { org_id: orgId, plan },
    })
  }, [sdkReady, amountHalalas, plan, planLabel, orgId, lang])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl p-6"
        style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('billing.payTitle', { plan: planLabel })}
            </div>
            <div className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
              {(amountHalalas / 100).toFixed(2)} SAR / {t('billing.perMonth')}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:opacity-70"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Moyasar form container */}
        {sdkError ? (
          <div className="rounded-lg p-4 text-center text-[13px]" style={{ color: 'var(--danger)', background: 'var(--danger-ghost)' }}>
            {t('billing.sdkLoadError')}
          </div>
        ) : !sdkReady ? (
          <div className="flex items-center justify-center gap-2 py-8 text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
            <Loader2 size={16} className="animate-spin" /> {t('billing.loadingPaymentForm')}
          </div>
        ) : (
          <div ref={containerRef} />
        )}
      </div>
    </div>
  )
}
