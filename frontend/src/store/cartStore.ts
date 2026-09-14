import { create } from 'zustand'
import { cartSessionStorage } from '@/lib/storage'

interface CartState {
  guestSessionId: string | null
  drawerOpen: boolean
  ensureGuestSessionId: () => string
  setGuestSessionId: (sessionId: string) => void
  clearGuestSessionId: () => void
  openDrawer: () => void
  closeDrawer: () => void
}

export const useCartStore = create<CartState>((set, get) => ({
  guestSessionId: cartSessionStorage.get(),
  drawerOpen: false,
  ensureGuestSessionId: () => {
    const existing = get().guestSessionId
    if (existing) return existing

    const created = crypto.randomUUID()
    cartSessionStorage.set(created)
    set({ guestSessionId: created })
    return created
  },
  setGuestSessionId: (sessionId) => {
    cartSessionStorage.set(sessionId)
    set({ guestSessionId: sessionId })
  },
  clearGuestSessionId: () => {
    cartSessionStorage.clear()
    set({ guestSessionId: null })
  },
  openDrawer: () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),
}))
