import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { AuthLayout } from '@/components/layout/AuthLayout'

// Auth pages
const LoginPage = () => import('@/features/auth').then((m) => ({ Component: m.LoginPage }))
const RegisterPage = () => import('@/features/auth').then((m) => ({ Component: m.RegisterPage }))
const ForgotPasswordPage = () => import('@/features/auth').then((m) => ({ Component: m.ForgotPasswordPage }))
const ResetPasswordPage = () => import('@/features/auth').then((m) => ({ Component: m.ResetPasswordPage }))
const VerifyEmailPage = () => import('@/features/auth').then((m) => ({ Component: m.VerifyEmailPage }))
const OnboardingPage = () => import('@/features/auth').then((m) => ({ Component: m.OnboardingPage }))
const InvitePage = () => import('@/features/auth').then((m) => ({ Component: m.InvitePage }))
const SSOPage = () => import('@/features/auth').then((m) => ({ Component: m.SSOPage }))

// Dashboard pages
const OverviewPage = () => import('@/features/overview').then((m) => ({ Component: m.OverviewPage }))
const ErrorsPage = () => import('@/features/errors').then((m) => ({ Component: m.ErrorsPage }))
const LogsPage = () => import('@/features/logs').then((m) => ({ Component: m.LogsPage }))
const RequestsPage = () => import('@/features/requests').then((m) => ({ Component: m.RequestsPage }))
const CronMonitorsPage = () => import('@/features/cron-monitors').then((m) => ({ Component: m.CronMonitorsPage }))
const FlagsPage = () => import('@/features/flags').then((m) => ({ Component: m.FlagsPage }))
const MonitorsPage = () => import('@/features/monitors').then((m) => ({ Component: m.MonitorsPage }))
const SSHPage = () => import('@/features/ssh').then((m) => ({ Component: m.SSHPage }))
const ChatPage = () => import('@/features/chat').then((m) => ({ Component: m.ChatPage }))
const AlertsPage = () => import('@/features/alerts').then((m) => ({ Component: m.AlertsPage }))
const BillingPage = () => import('@/features/billing').then((m) => ({ Component: m.BillingPage }))
const ReplayPage = () => import('@/features/replay').then((m) => ({ Component: m.ReplayPage }))
const ProjectsPage = () => import('@/features/projects').then((m) => ({ Component: m.ProjectsPage }))
const CreateProjectPage = () => import('@/features/projects').then((m) => ({ Component: m.CreateProjectPage }))
const CreateServerPage = () => import('@/features/ssh').then((m) => ({ Component: m.CreateServerPage }))

// Detail pages
const MonitorDetailPage = () => import('@/features/monitors').then((m) => ({ Component: m.MonitorDetailPage }))
const CronDetailPage = () => import('@/features/cron-monitors').then((m) => ({ Component: m.CronDetailPage }))
const FlagDetailPage = () => import('@/features/flags').then((m) => ({ Component: m.FlagDetailPage }))
const ProjectDetailPage = () => import('@/features/projects').then((m) => ({ Component: m.ProjectDetailPage }))

// Settings pages
const GeneralSettingsPage = () => import('@/features/settings').then((m) => ({ Component: m.GeneralSettingsPage }))
const MembersPage = () => import('@/features/settings').then((m) => ({ Component: m.MembersPage }))
const ApiKeysPage = () => import('@/features/settings').then((m) => ({ Component: m.ApiKeysPage }))

export const router = createBrowserRouter([
  // Auth routes
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', lazy: LoginPage },
      { path: '/register', lazy: RegisterPage },
      { path: '/forgot-password', lazy: ForgotPasswordPage },
      { path: '/reset-password', lazy: ResetPasswordPage },
      { path: '/verify-email', lazy: VerifyEmailPage },
      { path: '/onboarding', lazy: OnboardingPage },
      { path: '/invite/:code', lazy: InvitePage },
      { path: '/sso', lazy: SSOPage },
    ],
  },
  // App routes
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <Navigate to="/overview" replace /> },
      { path: '/overview', lazy: OverviewPage },
      { path: '/projects', lazy: ProjectsPage },
      { path: '/projects/new', lazy: CreateProjectPage },
      { path: '/projects/:projectId', lazy: ProjectDetailPage },
      { path: '/errors', lazy: ErrorsPage },
      { path: '/errors/:fingerprint/replay', lazy: ReplayPage },
      { path: '/logs', lazy: LogsPage },
      { path: '/requests', lazy: RequestsPage },
      { path: '/monitors', lazy: MonitorsPage },
      { path: '/monitors/:monitorId', lazy: MonitorDetailPage },
      { path: '/cron-monitors', lazy: CronMonitorsPage },
      { path: '/cron-monitors/:cronId', lazy: CronDetailPage },
      { path: '/flags', lazy: FlagsPage },
      { path: '/flags/:flagId', lazy: FlagDetailPage },
      { path: '/ssh', lazy: SSHPage },
      { path: '/ssh/new', lazy: CreateServerPage },
      { path: '/chat', lazy: ChatPage },
      { path: '/alerts', lazy: AlertsPage },
      { path: '/billing', lazy: BillingPage },
      { path: '/settings', element: <Navigate to="/settings/general" replace /> },
      { path: '/settings/general', lazy: GeneralSettingsPage },
      { path: '/settings/members', lazy: MembersPage },
      { path: '/settings/api-keys', lazy: ApiKeysPage },
    ],
  },
  { path: '*', element: <Navigate to="/overview" replace /> },
])
