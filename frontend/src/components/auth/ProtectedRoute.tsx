import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { buildLoginRedirect } from '@/lib/returnTo'
import { SplashScreen } from '@/components/layout/SplashScreen'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const status = useAuthStore((state) => state.status)
  const location = useLocation()

  if (status === 'loading') {
    return <SplashScreen />
  }

  if (status === 'anonymous') {
    return <Navigate to={buildLoginRedirect(location)} replace />
  }

  return children
}
