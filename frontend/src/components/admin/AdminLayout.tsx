import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingBag,
  BookOpen,
  Menu,
  LogOut,
  ArrowUpRight,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useLogout } from '@/features/auth/hooks'
import { Drawer } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { ToastContainer } from '@/components/ui/Toast'
const upcoming = [
  { label: 'Órdenes', icon: ShoppingBag, phase: '8c' },
  { label: 'Recetas', icon: BookOpen, phase: '8d' },
]
function AdminNavigation({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Navegación de administración" className="space-y-2">
      <NavLink
        to="/admin"
        end
        onClick={onNavigate}
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-md px-3 py-3 text-sm font-semibold ${isActive ? 'bg-vm-orange/10 text-vm-orange' : 'hover:bg-stone-50'}`
        }
      >
        <LayoutDashboard size={18} />
        Dashboard
      </NavLink>
      {[{label:'Productos', path:'productos', icon:Package}, {label:'Categorías', path:'categorias', icon:Tags}].map(({label,path,icon:Icon}) => <NavLink key={path} to={`/admin/${path}`} onClick={onNavigate} className={({isActive}) => `flex items-center gap-3 rounded-md px-3 py-3 text-sm font-semibold ${isActive ? 'bg-vm-orange/10 text-vm-orange' : 'hover:bg-stone-50'}`}><Icon size={18} />{label}</NavLink>)}
      {upcoming.map(({ label, icon: Icon, phase }) => (
        <button
          key={label}
          disabled
          title={`Disponible en la subentrega ${phase}`}
          className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm text-vm-muted"
        >
          <Icon size={18} />
          <span className="flex-1">{label}</span>
          <span className="text-xs">{phase}</span>
        </button>
      ))}
    </nav>
  )
}
export function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const user = useAuthStore((state) => state.user)
  const logout = useLogout()
  return (
    <div className="min-h-screen bg-white text-vm-ink">
      <a
        href="#admin-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-white focus:p-3"
      >
        Saltar al contenido
      </a>
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-vm-line bg-white md:flex">
        <div className="border-b border-vm-line px-6 py-6">
          <Link to="/admin" className="text-xl font-bold">
            Verde Mango
          </Link>
          <p className="mt-1 text-xs text-vm-muted">Administración</p>
        </div>
        <div className="flex-1 px-3 py-6">
          <AdminNavigation />
        </div>
        <Link to="/" className="flex items-center gap-2 border-t border-vm-line px-6 py-5 text-sm">
          Ver sitio público <ArrowUpRight size={16} />
        </Link>
      </aside>
      <div className="min-w-0 md:ml-60">
        <header className="flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-vm-line px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir navegación del panel"
              aria-expanded={menuOpen}
              className="rounded-md p-2 md:hidden"
            >
              <Menu size={22} />
            </button>
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold">{user?.fullName || user?.email}</p>
              <p className="mt-1 text-xs text-vm-muted">{user?.role}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={logout.isPending}
            onClick={() => logout.mutate()}
          >
            <LogOut size={16} />
            {logout.isPending ? 'Cerrando…' : 'Cerrar sesión'}
          </Button>
        </header>
        <main id="admin-content" className="min-w-0 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} side="left" title="Administración">
        <AdminNavigation onNavigate={() => setMenuOpen(false)} />
        <Link
          to="/"
          onClick={() => setMenuOpen(false)}
          className="mt-6 block border-t border-vm-line py-4 text-sm"
        >
          Ver sitio público
        </Link>
      </Drawer>
      <ToastContainer />
    </div>
  )
}
