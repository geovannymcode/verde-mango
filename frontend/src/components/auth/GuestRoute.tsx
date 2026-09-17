import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { SplashScreen } from '@/components/layout/SplashScreen'

interface GuestRouteProps {
  children: ReactNode
}

// Para /login y /registro: si ya hay sesión, no tiene sentido mostrar el formulario.
export function GuestRoute({ children }: GuestRouteProps) {
  const status = useAuthStore((state) => state.status)

  if (status === 'loading') {
    return <SplashScreen />
  }

  if (status === 'authenticated') {
    return <Navigate to="/" replace />
  }

  return children
}
