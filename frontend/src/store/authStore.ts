import { create } from 'zustand'
import type { UserResponse } from '@/api/schema'
import { refreshTokenStorage } from '@/lib/storage'

type AuthState = {
  accessToken: string | null
  user: UserResponse | null
  isAuthenticated: boolean
  setSession: (accessToken: string, refreshToken: string, user?: UserResponse | null) => void
  setAccessToken: (accessToken: string) => void
  setUser: (user: UserResponse | null) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  setSession: (accessToken, refreshToken, user = null) => {
    refreshTokenStorage.set(refreshToken)
    set({ accessToken, user, isAuthenticated: true })
  },
  setAccessToken: (accessToken) => set({ accessToken, isAuthenticated: true }),
  setUser: (user) => set({ user }),
  clearSession: () => {
    refreshTokenStorage.clear()
    set({ accessToken: null, user: null, isAuthenticated: false })
  },
}))
