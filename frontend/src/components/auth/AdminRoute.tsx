import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { buildLoginRedirect } from '@/lib/returnTo'
import { SplashScreen } from '@/components/layout/SplashScreen'
import { ForbiddenPage } from '@/pages/ForbiddenPage'

const ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN'])

interface AdminRouteProps {
  children: ReactNode
}

export function AdminRoute({ children }: AdminRouteProps) {
  const status = useAuthStore((state) => state.status)
  const user = useAuthStore((state) => state.user)
  const location = useLocation()

  if (status === 'loading') {
    return <SplashScreen />
  }

  if (status === 'anonymous') {
    return <Navigate to={buildLoginRedirect(location)} replace />
  }

  // Autenticado pero sin el rol requerido: se muestra 403, nunca se redirige a /login (ya inició
  // sesión, solo le falta el permiso).
  if (!user || !ADMIN_ROLES.has(user.role)) {
    return <ForbiddenPage />
  }

  return children
}
