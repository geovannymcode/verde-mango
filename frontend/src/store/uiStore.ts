import { create } from 'zustand'

export interface Toast {
  id: string
  message: string
  variant?: 'success' | 'error' | 'info'
}

interface UiState {
  mobileNavOpen: boolean
  cartDrawerOpen: boolean
  toasts: Toast[]
  openMobileNav: () => void
  closeMobileNav: () => void
  openCartDrawer: () => void
  closeCartDrawer: () => void
  pushToast: (toast: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void
}

export const useUiStore = create<UiState>((set) => ({
  mobileNavOpen: false,
  cartDrawerOpen: false,
  toasts: [],
  openMobileNav: () => set({ mobileNavOpen: true }),
  closeMobileNav: () => set({ mobileNavOpen: false }),
  openCartDrawer: () => set({ cartDrawerOpen: true }),
  closeCartDrawer: () => set({ cartDrawerOpen: false }),
  pushToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: crypto.randomUUID() }],
    })),
  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}))
