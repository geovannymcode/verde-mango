import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { LogOut, Shield, User, UserRound } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useLogout } from '@/features/auth/hooks'

const ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN'])

export function UserMenu() {
  const status = useAuthStore((state) => state.status)
  const user = useAuthStore((state) => state.user)
  const logout = useLogout()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  if (status !== 'authenticated' || !user) {
    return (
      <Link
        to="/login"
        aria-label="Iniciar sesión"
        className="hidden h-10 w-10 items-center justify-center rounded-vm-full text-vm-ink hover:bg-vm-cream sm:flex"
      >
        <User size={20} />
      </Link>
    )
  }

  const isAdmin = ADMIN_ROLES.has(user.role)

  return (
    <div ref={containerRef} className="relative hidden sm:block">
      <button
        type="button"
        aria-label="Mi cuenta"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 w-10 items-center justify-center rounded-vm-full text-vm-ink hover:bg-vm-cream"
      >
        <UserRound size={20} />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-56 rounded-vm-lg border border-vm-line bg-vm-white py-2 shadow-lg">
          <p className="truncate px-4 py-1.5 text-sm font-semibold text-vm-ink">{user.fullName}</p>
          <p className="truncate px-4 pb-1.5 text-xs text-vm-muted">{user.email}</p>
          <div className="my-1 border-t border-vm-line" />
          <Link
            to="/cuenta"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-vm-ink hover:bg-vm-cream"
          >
            Mi perfil
          </Link>
          <Link
            to="/cuenta/ordenes"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-vm-ink hover:bg-vm-cream"
          >
            Mis órdenes
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-vm-ink hover:bg-vm-cream"
            >
              <Shield size={14} /> Panel admin
            </Link>
          )}
          <div className="my-1 border-t border-vm-line" />
          <button
            type="button"
            disabled={logout.isPending}
            onClick={() => {
              setOpen(false)
              logout.mutate()
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            <LogOut size={14} /> {logout.isPending ? 'Cerrando sesión…' : 'Cerrar sesión'}
          </button>
        </div>
      )}
    </div>
  )
}
