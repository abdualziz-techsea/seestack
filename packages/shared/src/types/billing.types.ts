export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing'

export type InvoiceStatus =
  | 'initiated'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'canceled'
  | 'on_hold'
  | 'expired'
  | 'voided'

export interface PlanLimits {
  projects: number
  errorsPerMonth: number
  monitors: number
  sshServers: number
  members: number
  logRetentionDays: number
}

export interface Subscription {
  id: string
  orgId: string
  plan: import('./auth.types').Plan
  status: SubscriptionStatus
  currentPeriodStart: string
  currentPeriodEnd: string
  moyasarInvoiceId: string
}

export interface BillingUsage {
  errorsThisMonth: number
  monitors: number
  sshServers: number
  members: number
  limits: PlanLimits
}

export interface BillingInvoice {
  id: string
  moyasarId: string
  plan: string
  amountHalalas: number
  amountFormat: string
  currency: string
  status: InvoiceStatus
  createdAt: string
  updatedAt: string
}

export interface PlanPriceResult {
  plan: string
  amountHalalas: number
  currency: string
}

export interface VerifyPaymentResult {
  plan: string
  paymentId: string
  status: string
  amountFormat: string
}
