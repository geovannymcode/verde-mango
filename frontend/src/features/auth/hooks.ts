import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from '@/api/auth'
import { refreshAccessToken } from '@/api/client'
import type { LoginRequest, RegisterRequest } from '@/api/schema'
import { refreshTokenStorage } from '@/lib/storage'
import { useAuthStore } from '@/store/authStore'
import { useMergeCart } from '@/features/cart/hooks'
import { authKeys } from '@/features/auth/keys'

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession)
  const mergeCart = useMergeCart()

  return useMutation({
    mutationFn: (payload: LoginRequest) => loginRequest(payload),
    onSuccess: (data) => {
      setSession(data.accessToken, data.refreshToken, data.user)
      mergeCart.mutate()
    },
  })
}

export function useRegister() {
  const setSession = useAuthStore((state) => state.setSession)
  const mergeCart = useMergeCart()

  return useMutation({
    mutationFn: (payload: RegisterRequest) => registerRequest(payload),
    onSuccess: (data) => {
      setSession(data.accessToken, data.refreshToken, data.user)
      mergeCart.mutate()
    },
  })
}

export function useLogout() {
  const clearSession = useAuthStore((state) => state.clearSession)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logoutRequest,
    onSettled: () => {
      clearSession()
      void queryClient.invalidateQueries()
    },
  })
}

export function useCurrentUser(enabled: boolean) {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: getCurrentUser,
    enabled,
    staleTime: 5 * 60_000,
  })
}

// Al recargar la página el access token vive solo en memoria (Zustand), pero el refresh
// token persiste en localStorage. Este hook intenta restaurar la sesión una sola vez al
// montar la app, para que las rutas protegidas (ej. /checkout) y el header reflejen el
// estado real de autenticación sin esperar a un 401.
export function useAuthBootstrap() {
  const setAccessToken = useAuthStore((state) => state.setAccessToken)
  const setUser = useAuthStore((state) => state.setUser)
  const clearSession = useAuthStore((state) => state.clearSession)

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      if (!refreshTokenStorage.get()) return

      try {
        const accessToken = await refreshAccessToken()
        if (cancelled) return
        setAccessToken(accessToken)

        const user = await getCurrentUser()
        if (!cancelled) setUser(user)
      } catch {
        if (!cancelled) clearSession()
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [setAccessToken, setUser, clearSession])
}
