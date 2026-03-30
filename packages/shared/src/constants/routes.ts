export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
  ONBOARDING: '/onboarding',
  SSO: '/sso',

  OVERVIEW: '/overview',
  ERRORS: '/errors',
  REPLAY: '/errors/:fingerprint/replay',
  LOGS: '/logs',
  MONITORS: '/monitors',
  SSH: '/ssh',
  CHAT: '/chat',
  ALERTS: '/alerts',
  BILLING: '/billing',

  SETTINGS: '/settings',
  SETTINGS_GENERAL: '/settings/general',
  SETTINGS_MEMBERS: '/settings/members',
  SETTINGS_API_KEYS: '/settings/api-keys',
} as const
