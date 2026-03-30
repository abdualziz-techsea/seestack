import type { Plan } from '../types/auth.types'
import type { PlanLimits } from '../types/billing.types'

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    projects: 1,
    errorsPerMonth: 1_000,
    monitors: 5,
    sshServers: 0,
    members: 1,
    logRetentionDays: 3,
  },
  starter: {
    projects: 3,
    errorsPerMonth: 20_000,
    monitors: 20,
    sshServers: 2,
    members: 5,
    logRetentionDays: 14,
  },
  pro: {
    projects: 10,
    errorsPerMonth: 100_000,
    monitors: 100,
    sshServers: 10,
    members: 20,
    logRetentionDays: 30,
  },
  scale: {
    projects: -1,
    errorsPerMonth: -1,
    monitors: -1,
    sshServers: -1,
    members: -1,
    logRetentionDays: 90,
  },
}

export const PLAN_PRICES = {
  free:    { monthly: 0,  annual: 0  },
  starter: { monthly: 19, annual: 15 },
  pro:     { monthly: 49, annual: 39 },
  scale:   { monthly: 99, annual: 79 },
}
