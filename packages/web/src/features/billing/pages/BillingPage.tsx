import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { PLAN_PRICES } from '@seestack/shared'
import type { BillingInvoice, InvoiceStatus } from '@seestack/shared'
import {
  Check, RefreshCw, AlertCircle, CheckCircle2,
  Clock, XCircle, X, CreditCard
} from 'lucide-react'
import { SkeletonRow } from '@/components/shared/SkeletonRow'
import { Toggle } from '@/components/shared/Toggle'
import { useBillingUsage } from '../hooks/useBillingUsage'
import { useSubscription } from '../hooks/useSubscription'
import { usePlanPrice, useUpgradePlan } from '../hooks/useUpgrade'
import { useInvoices } from '../hooks/useInvoices'
import { useVerifyPayment } from '../hooks/useVerifyPayment'
import { PaymentModal } from '../components/PaymentModal'
import { useAuthStore } from '@/store/auth.store'

const plans = ['free', 'starter', 'pro', 'scale'] as const

// ── Status badge ─────────────────────────────────────────────────
function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const map: Record<InvoiceStatus, { icon: React.ReactNode; color: string; bg: string }> = {
    paid:      { icon: <CheckCircle2 size={11} />, color: 'var(--success)', bg: 'var(--success-ghost)' },
    initiated: { icon: <Clock size={11} />, color: 'var(--warning)', bg: 'var(--warning-ghost)' },
    failed:    { icon: <XCircle size={11} />, color: 'var(--danger)', bg: 'var(--danger-ghost)' },
    canceled:  { icon: <X size={11} />, color: 'var(--text-tertiary)', bg: 'var(--bg-elevated)' },
    refunded:  { icon: <RefreshCw size={11} />, color: 'var(--primary)', bg: 'var(--primary-ghost)' },
    on_hold:   { icon: <Clock size={11} />, color: 'var(--warning)', bg: 'var(--warning-ghost)' },
    expired:   { icon: <XCircle size={11} />, color: 'var(--text-tertiary)', bg: 'var(--bg-elevated)' },
    voided:    { icon: <XCircle size={11} />, color: 'var(--text-tertiary)', bg: 'var(--bg-elevated)' },
  }
  const cfg = map[status] ?? map.initiated
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize"
      style={{ color: cfg.color, background: cfg.bg }}>
      {cfg.icon}
      {status.replace('_', ' ')}
    </span>
  )
}

// ── Main page ─────────────────────────────────────────────────────
export function BillingPage() {
  const { t } = useTranslation()
  const org = useAuthStore((s) => s.org)
  const [annual, setAnnual] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  const { usage, isLoading: usageLoading } = useBillingUsage()
  const { subscription, isLoading: subLoading, error: subError } = useSubscription()
  const { invoices, isLoading: invoicesLoading, refetch: refetchInvoices } = useInvoices()
  const { selectedPlan, setSelectedPlan } = useUpgradePlan()
  const { priceData } = usePlanPrice(selectedPlan)
  const verifyPayment = useVerifyPayment()

  const currentPlan = subscription?.plan ?? 'free'

  // ── Handle Moyasar callback_url redirect ──────────────────────
  const callbackPaymentId = searchParams.get('id')
  const callbackStatus    = searchParams.get('status')
  const callbackPlan      = searchParams.get('plan')
  const callbackOrgId     = searchParams.get('orgId')

  const [verifyState, setVerifyState] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle')
  const [verifiedPlan, setVerifiedPlan] = useState('')

  useEffect(() => {
    // When Moyasar redirects back: /billing?id=pay_xxx&status=paid&plan=pro&orgId=xxx
    if (
      callbackPaymentId &&
      callbackStatus === 'paid' &&
      callbackPlan &&
      verifyState === 'idle' &&
      org
    ) {
      setVerifyState('verifying')
      verifyPayment.mutate(
        { paymentId: callbackPaymentId, plan: callbackPlan },
        {
          onSuccess: (data) => {
            setVerifiedPlan(data?.plan ?? callbackPlan)
            setVerifyState('success')
            // Clear URL params after success
            setSearchParams({}, { replace: true })
          },
          onError: () => {
            setVerifyState('failed')
          },
        },
      )
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callbackPaymentId, callbackStatus, callbackPlan, org])

  // Auto-dismiss success banner
  useEffect(() => {
    if (verifyState === 'success') {
      const t = setTimeout(() => setVerifyState('idle'), 8000)
      return () => clearTimeout(t)
    }
  }, [verifyState])

  const usageBars = usage ? [
    { label: t('billing.usageErrors'),  current: usage.errorsThisMonth,   limit: usage.limits.errorsPerMonth },
    { label: t('billing.usageMonitors'), current: usage.monitors,          limit: usage.limits.monitors },
    { label: t('billing.usageSSH'),     current: usage.sshServers,         limit: usage.limits.sshServers },
    { label: t('billing.usageMembers'), current: usage.members,            limit: usage.limits.members },
  ] : []

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{t('nav.billing')}</h1>

      {/* ── Verification states ── */}
      {verifyState === 'verifying' && (
        <div className="flex items-center gap-3 rounded-xl border p-4"
          style={{ borderColor: 'var(--border-accent)', background: 'var(--bg-raised)' }}>
          <RefreshCw size={16} className="animate-spin" style={{ color: 'var(--primary)' }} />
          <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            {t('billing.verifyingPayment')}
          </span>
        </div>
      )}

      {verifyState === 'success' && (
        <div className="flex items-center gap-3 rounded-xl border p-4"
          style={{ borderColor: 'var(--success)', background: 'var(--success-ghost)' }}>
          <CheckCircle2 size={18} style={{ color: 'var(--success)', flexShrink: 0 }} />
          <div>
            <div className="text-[13px] font-semibold" style={{ color: 'var(--success)' }}>
              {t('billing.paymentSuccess')}
            </div>
            <div className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
              {t('billing.planUpgraded', { plan: t(`billing.${verifiedPlan}`) })}
            </div>
          </div>
        </div>
      )}

      {verifyState === 'failed' && (
        <div className="flex items-center gap-3 rounded-xl border p-4"
          style={{ borderColor: 'var(--danger)', background: 'var(--danger-ghost)' }}>
          <AlertCircle size={18} style={{ color: 'var(--danger)', flexShrink: 0 }} />
          <div className="text-[13px]" style={{ color: 'var(--danger)' }}>
            {t('billing.verifyError')}
          </div>
        </div>
      )}

      {/* ── Current plan ── */}
      <div className="border p-4"
        style={{ borderColor: 'var(--border-accent)', background: 'var(--bg-raised)', borderRadius: 'var(--radius-xl)' }}>
        {subLoading ? <SkeletonRow /> : subError ? (
          <div className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--danger)' }}>
            <AlertCircle size={14} /> {t('billing.loadError')}
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                {t('billing.currentPlan')}
              </div>
              <div className="mt-1 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {t(`billing.${currentPlan}`)}
              </div>
              {subscription?.status && (
                <div className="mt-0.5 text-[12px] capitalize" style={{ color: 'var(--text-tertiary)' }}>
                  {subscription.status}
                </div>
              )}
            </div>
            <div className="text-end">
              <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {annual ? PLAN_PRICES[currentPlan].annual : PLAN_PRICES[currentPlan].monthly}{' '}
                <span className="text-base font-normal">SAR</span>
              </div>
              <div className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>{t('billing.perMonth')}</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Usage bars ── */}
      <div className="border p-4"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)', borderRadius: 'var(--radius-xl)' }}>
        <h3 className="mb-4 text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{t('billing.usage')}</h3>
        {usageLoading ? <SkeletonRow /> : (
          <div className="space-y-4">
            {usageBars.map((u) => {
              const pct = u.limit > 0 ? (u.current / u.limit) * 100 : 0
              const barColor = pct > 95 ? 'var(--danger)' : pct > 80 ? 'var(--warning)' : 'var(--primary)'
              return (
                <div key={u.label}>
                  <div className="mb-1 flex items-center justify-between text-[12px]">
                    <span style={{ color: 'var(--text-secondary)' }}>{u.label}</span>
                    <span style={{ color: 'var(--text-primary)' }}>
                      {u.current.toLocaleString()} / {u.limit > 0 ? u.limit.toLocaleString() : '—'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--bg-elevated)' }}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(pct, 100)}%`, background: barColor }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Billing cycle toggle ── */}
      <div className="flex items-center justify-center gap-3">
        <span className="text-[13px]" style={{ color: annual ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>
          {t('billing.monthly')}
        </span>
        <Toggle checked={annual} onChange={() => setAnnual(!annual)} size="md" />
        <span className="text-[13px]" style={{ color: annual ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
          {t('billing.annual')}{' '}
          <span className="rounded px-1 py-0.5 text-[10px] font-medium"
            style={{ background: 'var(--success-ghost)', color: 'var(--success)' }}>
            {t('billing.savePercent')}
          </span>
        </span>
      </div>

      {/* ── Plan cards ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const isCurrent = plan === currentPlan
          const price = annual ? PLAN_PRICES[plan].annual : PLAN_PRICES[plan].monthly
          return (
            <div key={plan} className="relative border p-5"
              style={{
                borderColor: isCurrent ? 'var(--primary)' : 'var(--border)',
                background: 'var(--bg-raised)',
                borderRadius: 'var(--radius-xl)',
              }}>
              {isCurrent && (
                <div className="absolute -top-2.5 start-4 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase"
                  style={{ background: 'var(--primary)', color: 'var(--bg-base)' }}>
                  {t('billing.yourPlan')}
                </div>
              )}
              <div className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                {t(`billing.${plan}`)}
              </div>
              <div className="mt-2">
                <span className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{price}</span>
                <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}> SAR/{t('billing.perMonth')}</span>
              </div>
              <ul className="mt-4 space-y-2">
                {(t(`billing.features.${plan}`, { returnObjects: true }) as string[]).map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                    <Check size={12} style={{ color: 'var(--success)', flexShrink: 0 }} /> {f}
                  </li>
                ))}
              </ul>
              <button
                disabled={isCurrent || plan === 'free'}
                onClick={() => !isCurrent && plan !== 'free' && setSelectedPlan(plan)}
                className="mt-4 w-full rounded-lg py-2 text-[13px] font-medium transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                style={{
                  background: isCurrent ? 'var(--bg-elevated)' : 'var(--primary)',
                  color: isCurrent ? 'var(--text-tertiary)' : 'var(--bg-base)',
                }}>
                {isCurrent || plan === 'free' ? (
                  t('billing.current')
                ) : (
                  <><CreditCard size={12} /> {t('billing.upgrade')}</>
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* ── Payment history / invoices ── */}
      <div className="border" style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)', borderRadius: 'var(--radius-xl)' }}>
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
            {t('billing.invoices')}
          </h3>
          <button onClick={() => refetchInvoices()}
            className="flex items-center gap-1.5 text-[12px] hover:opacity-70"
            style={{ color: 'var(--text-tertiary)' }}>
            <RefreshCw size={12} /> {t('billing.refresh')}
          </button>
        </div>

        {invoicesLoading ? (
          <div className="p-4"><SkeletonRow /></div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-12">
            <div className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>{t('billing.noInvoices')}</div>
            <div className="text-[12px]" style={{ color: 'var(--text-muted, var(--text-tertiary))' }}>
              {t('billing.noInvoicesDesc')}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-[11px] font-medium uppercase tracking-wider"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-tertiary)' }}>
                  <th className="px-4 py-2.5 text-start">{t('billing.invoicePlan')}</th>
                  <th className="px-4 py-2.5 text-start">{t('billing.invoiceAmount')}</th>
                  <th className="px-4 py-2.5 text-start">{t('billing.invoiceStatus')}</th>
                  <th className="px-4 py-2.5 text-start">{t('billing.invoiceDate')}</th>
                </tr>
              </thead>
              <tbody>
                {(invoices as BillingInvoice[]).map((invoice) => (
                  <tr key={invoice.id} className="border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-4 py-3">
                      <span className="text-[13px] font-medium capitalize" style={{ color: 'var(--text-primary)' }}>
                        {t(`billing.${invoice.plan}`, { defaultValue: invoice.plan })}
                      </span>
                      <div className="mt-0.5 font-mono text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                        {invoice.moyasarId.slice(0, 12)}…
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[13px]" style={{ color: 'var(--text-primary)' }}>
                        {invoice.amountFormat}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <InvoiceStatusBadge status={invoice.status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(invoice.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric', month: 'short', day: 'numeric',
                        })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Moyasar Payment Modal ── */}
      {selectedPlan && priceData && org && (
        <PaymentModal
          plan={selectedPlan}
          planLabel={t(`billing.${selectedPlan}`)}
          amountHalalas={priceData.amountHalalas}
          orgId={org.id}
          onClose={() => setSelectedPlan(null)}
        />
      )}
    </div>
  )
}
