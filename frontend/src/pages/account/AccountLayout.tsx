import { NavLink, Outlet } from 'react-router-dom'
import { LogOut, Package, UserRound } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useLogout } from '@/features/auth/hooks'
import { SectionTitle } from '@/components/layout/SectionTitle'

const links = [
  { to: '/cuenta', label: 'Perfil', icon: UserRound, end: true },
  { to: '/cuenta/ordenes', label: 'Mis órdenes', icon: Package, end: false },
]

export function AccountLayout() {
  const user = useAuthStore((state) => state.user)
  const logout = useLogout()

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <SectionTitle
        eyebrow="mi cuenta"
        title={user ? `Hola, ${user.firstName}` : 'Tu cuenta'}
        className="mb-8"
      />

      <div className="flex flex-col gap-8 md:flex-row">
        <aside className="flex shrink-0 flex-row gap-1 overflow-x-auto md:w-56 md:flex-col md:overflow-visible">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 whitespace-nowrap rounded-vm-md px-3 py-2.5 text-sm font-semibold ${
                  isActive ? 'bg-vm-orange/10 text-vm-orange' : 'text-vm-ink hover:bg-vm-cream'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
          <button
            type="button"
            disabled={logout.isPending}
            onClick={() => logout.mutate()}
            className="flex items-center gap-2 whitespace-nowrap rounded-vm-md px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            <LogOut size={16} /> {logout.isPending ? 'Cerrando sesión…' : 'Cerrar sesión'}
          </button>
        </aside>

        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
