import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getProfile,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  updateProfile as updateProfileRequest,
  type UpdateProfilePayload,
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
    // AuthService.logout revoca TODOS los refresh tokens del usuario en el backend. Si esa
    // llamada falla (ej. red caída) igual limpiamos la sesión local: un logout nunca debe dejar
    // al usuario "atascado" con sesión activa en el cliente.
    onSettled: () => {
      clearSession()
      queryClient.clear()
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    },
  })
}

export function useProfile(enabled: boolean) {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: getProfile,
    enabled,
    staleTime: 5 * 60_000,
  })
}

// GAP (ver @/api/auth.ts y docs/api-gaps.md): no existe endpoint real para actualizar el perfil.
// Este hook queda listo para cuando el backend lo implemente; la UI de /cuenta no lo invoca hoy.
export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateProfileRequest(payload),
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.me(), user)
      void queryClient.invalidateQueries({ queryKey: authKeys.me() })
    },
  })
}

// Al recargar la página el access token vive solo en memoria (Zustand), pero el refresh token
// persiste en localStorage. Este hook intenta restaurar la sesión una sola vez al montar la app:
// mientras se resuelve, el store queda en status='loading' (ver AuthStatus en authStore.ts) para
// que ninguna ruta protegida ni el header decidan nada todavía y nunca "parpadee" /login a un
// usuario que sí tiene sesión.
export function useAuthBootstrap() {
  const setUser = useAuthStore((state) => state.setUser)
  const setStatus = useAuthStore((state) => state.setStatus)
  const clearSession = useAuthStore((state) => state.clearSession)

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      if (!refreshTokenStorage.get()) {
        if (!cancelled) setStatus('anonymous')
        return
      }

      try {
        // refreshAccessToken (@/api/client.ts) ya persiste el accessToken en memoria y rota/
        // persiste el refreshToken en localStorage, dejando status='authenticated'.
        await refreshAccessToken()
        if (cancelled) return

        const user = await getProfile()
        if (cancelled) return
        setUser(user)
      } catch {
        if (!cancelled) clearSession()
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [setUser, setStatus, clearSession])
}
