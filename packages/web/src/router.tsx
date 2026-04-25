import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { AuthLayout } from '@/components/layout/AuthLayout'

const LoginPage = () => import('@/features/auth').then((m) => ({ Component: m.LoginPage }))
const RegisterPage = () => import('@/features/auth').then((m) => ({ Component: m.RegisterPage }))
const OverviewPage = () => import('@/features/overview').then((m) => ({ Component: m.OverviewPage }))
const ProjectsPage = () => import('@/features/projects').then((m) => ({ Component: m.ProjectsPage }))
const ErrorsPage = () => import('@/features/errors').then((m) => ({ Component: m.ErrorsPage }))
const ErrorDetailPage = () => import('@/features/errors').then((m) => ({ Component: m.ErrorDetailPage }))
const MonitorsPage = () => import('@/features/monitors').then((m) => ({ Component: m.MonitorsPage }))
const MonitorDetailPage = () => import('@/features/monitors').then((m) => ({ Component: m.MonitorDetailPage }))
const SdkSetupPage = () => import('@/features/sdk-setup').then((m) => ({ Component: m.SdkSetupPage }))
const SecurityScanPage = () => import('@/features/security-scan').then((m) => ({ Component: m.SecurityScanPage }))
const LoadTestPage = () => import('@/features/load-test').then((m) => ({ Component: m.LoadTestPage }))

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', lazy: LoginPage },
      { path: '/register', lazy: RegisterPage },
    ],
  },
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <Navigate to="/overview" replace /> },
      { path: '/overview', lazy: OverviewPage },
      { path: '/projects', lazy: ProjectsPage },
      { path: '/errors', lazy: ErrorsPage },
      { path: '/errors/:fingerprint', lazy: ErrorDetailPage },
      { path: '/monitors', lazy: MonitorsPage },
      { path: '/monitors/:monitorId', lazy: MonitorDetailPage },
      { path: '/sdk-setup', lazy: SdkSetupPage },
      { path: '/security-scan', lazy: SecurityScanPage },
      { path: '/load-test', lazy: LoadTestPage },
    ],
  },
  { path: '*', element: <Navigate to="/overview" replace /> },
])
