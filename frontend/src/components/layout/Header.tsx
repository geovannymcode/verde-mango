import { Link, NavLink } from 'react-router-dom'
import { Menu, Search, ShoppingBag, User } from 'lucide-react'
import { useUiStore } from '@/store/uiStore'

const leftLinks = [
  { to: '/productos', label: 'Tienda' },
  { to: '/recetas', label: 'Recetas' },
]

const rightLinks = [
  { to: '/nosotros', label: 'Nosotros' },
  { to: '/contacto', label: 'Contacto' },
]

function linkClass({ isActive }: { isActive: boolean }) {
  return `text-sm font-semibold uppercase tracking-wide transition-colors ${
    isActive ? 'text-vm-orange' : 'text-vm-ink hover:text-vm-orange'
  }`
}

export function Header() {
  const openMobileNav = useUiStore((state) => state.openMobileNav)
  const openCartDrawer = useUiStore((state) => state.openCartDrawer)

  return (
    <header className="sticky top-0 z-40 border-b border-vm-line bg-vm-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <button
          type="button"
          aria-label="Abrir menú"
          onClick={openMobileNav}
          className="flex h-10 w-10 items-center justify-center rounded-vm-full text-vm-ink hover:bg-vm-cream lg:hidden"
        >
          <Menu size={22} />
        </button>

        <nav aria-label="Navegación principal" className="hidden flex-1 items-center gap-8 lg:flex">
          {leftLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <Link to="/" className="flex flex-col items-center leading-none">
          <span className="text-xl font-extrabold text-vm-ink">
            Verde<span className="text-vm-orange">Mango</span>
          </span>
          <span className="font-hand text-sm text-vm-green">vegan wonders</span>
        </Link>

        <nav
          aria-label="Navegación secundaria"
          className="hidden flex-1 items-center justify-end gap-8 lg:flex"
        >
          {rightLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Buscar"
            className="hidden h-10 w-10 items-center justify-center rounded-vm-full text-vm-ink hover:bg-vm-cream sm:flex"
          >
            <Search size={20} />
          </button>
          <Link
            to="/cuenta"
            aria-label="Mi cuenta"
            className="hidden h-10 w-10 items-center justify-center rounded-vm-full text-vm-ink hover:bg-vm-cream sm:flex"
          >
            <User size={20} />
          </Link>
          <button
            type="button"
            aria-label="Abrir carrito"
            onClick={openCartDrawer}
            className="relative flex h-10 w-10 items-center justify-center rounded-vm-full text-vm-ink hover:bg-vm-cream"
          >
            <ShoppingBag size={20} />
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-vm-full bg-vm-orange text-[10px] font-bold text-vm-white">
              0
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}
