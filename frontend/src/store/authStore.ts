import { create } from 'zustand'
import type { UserResponse } from '@/api/schema'
import { refreshTokenStorage } from '@/lib/storage'

// 'loading': se está intentando restaurar la sesión desde el refresh token de localStorage
// (ver useAuthBootstrap). Ninguna ruta protegida debe decidir nada mientras esté en este estado,
// para no parpadear /login a un usuario que sí tiene sesión.
export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

type AuthState = {
  accessToken: string | null
  user: UserResponse | null
  status: AuthStatus
  // Nunca se persiste el accessToken (solo vive en memoria). El refreshToken se persiste en
  // localStorage vía @/lib/storage (clave `vm_refresh_token`).
  setSession: (accessToken: string, refreshToken: string, user: UserResponse) => void
  // Usado tras un refresh silencioso: actualiza los tokens sin pisar el `user` ya cargado.
  updateTokens: (accessToken: string, refreshToken: string) => void
  setUser: (user: UserResponse | null) => void
  setStatus: (status: AuthStatus) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  status: 'loading',
  setSession: (accessToken, refreshToken, user) => {
    refreshTokenStorage.set(refreshToken)
    set({ accessToken, user, status: 'authenticated' })
  },
  updateTokens: (accessToken, refreshToken) => {
    refreshTokenStorage.set(refreshToken)
    set((state) => ({ accessToken, status: state.user ? 'authenticated' : 'loading' }))
  },
  setUser: (user) => set({ user, status: user ? 'authenticated' : 'anonymous' }),
  setStatus: (status) => set({ status }),
  clearSession: () => {
    refreshTokenStorage.clear()
    set({ accessToken: null, user: null, status: 'anonymous' })
  },
}))
