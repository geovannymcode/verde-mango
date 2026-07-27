import { NavLink } from 'react-router-dom'
import { useUiStore } from '@/store/uiStore'
import { Drawer } from '@/components/ui/Drawer'

const links = [
  { to: '/', label: 'Inicio' },
  { to: '/productos', label: 'Tienda' },
  { to: '/recetas', label: 'Recetas' },
  { to: '/nosotros', label: 'Nosotros' },
  { to: '/contacto', label: 'Contacto' },
  { to: '/cuenta', label: 'Mi cuenta' },
]

export function MobileNav() {
  const mobileNavOpen = useUiStore((state) => state.mobileNavOpen)
  const closeMobileNav = useUiStore((state) => state.closeMobileNav)

  return (
    <Drawer open={mobileNavOpen} onClose={closeMobileNav} title="Menú" side="left">
      <nav className="flex flex-col gap-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            onClick={closeMobileNav}
            className={({ isActive }) =>
              `rounded-vm-md px-3 py-2.5 text-sm font-semibold uppercase tracking-wide ${
                isActive ? 'bg-vm-orange/10 text-vm-orange' : 'text-vm-ink hover:bg-vm-cream'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </Drawer>
  )
}
