import { apiClient } from './client'
import type { Subscription, BillingUsage, BillingInvoice, VerifyPaymentResult, PlanPriceResult } from '../types/billing.types'

export const billingApi = {
  getSubscription: (orgId: string) =>
    apiClient.get<Subscription>(`/api/v1/billing/subscription`, { params: { orgId } }),

  getUsage: (orgId: string) =>
    apiClient.get<BillingUsage>(`/api/v1/billing/usage`, { params: { orgId } }),

  /** Fetch the plan price from the backend (prevents client-side amount tampering). */
  getPlanPrice: (plan: string) =>
    apiClient.get<PlanPriceResult>(`/api/v1/billing/plan-price`, { params: { plan } }),

  /**
   * Called after Moyasar JS SDK payment completes and Moyasar redirects back.
   * Verifies server-side that the payment is valid and upgrades the subscription.
   */
  verifyPayment: (orgId: string, paymentId: string, plan: string) =>
    apiClient.post<VerifyPaymentResult>('/api/v1/billing/verify-payment', { orgId, paymentId, plan }),

  listInvoices: (orgId: string) =>
    apiClient.get<BillingInvoice[]>(`/api/v1/billing/invoices`, { params: { orgId } }),

  getInvoice: (orgId: string, moyasarId: string) =>
    apiClient.get<BillingInvoice>(`/api/v1/billing/invoices/${moyasarId}`, { params: { orgId } }),

  refundPayment: (paymentId: string, amountHalalas?: number) =>
    apiClient.post<Record<string, unknown>>(`/api/v1/billing/payments/${paymentId}/refund`,
      amountHalalas !== undefined ? { amountHalalas } : {}),
}
