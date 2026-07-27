import { Link } from 'react-router-dom'
import { Globe, Mail, MessageCircle } from 'lucide-react'

interface FooterLink {
  to: string
  label: string
}

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-wide text-vm-ink">{title}</p>
      <ul className="mt-3 flex flex-col gap-2">
        {links.map((link) => (
          <li key={link.to}>
            <Link to={link.to} className="text-sm text-vm-muted hover:text-vm-orange">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-vm-line bg-vm-cream">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <p className="text-xl font-extrabold text-vm-ink">
            Verde<span className="text-vm-orange">Mango</span>
          </p>
          <p className="mt-3 text-sm text-vm-muted">
            Fermentos, veg-quesos, frutas, verduras y recetas 100% veganas, hechas con cariño.
          </p>
          <div className="mt-4 flex gap-3">
            <a aria-label="Sitio web" href="#" className="text-vm-muted hover:text-vm-orange">
              <Globe size={20} />
            </a>
            <a aria-label="WhatsApp" href="#" className="text-vm-muted hover:text-vm-orange">
              <MessageCircle size={20} />
            </a>
            <a aria-label="Correo" href="#" className="text-vm-muted hover:text-vm-orange">
              <Mail size={20} />
            </a>
          </div>
        </div>

        <FooterColumn
          title="Tienda"
          links={[
            { to: '/productos', label: 'Todos los productos' },
            { to: '/recetas', label: 'Recetas' },
          ]}
        />
        <FooterColumn
          title="Cuenta"
          links={[
            { to: '/login', label: 'Iniciar sesión' },
            { to: '/registro', label: 'Crear cuenta' },
            { to: '/cuenta', label: 'Mi cuenta' },
          ]}
        />
        <FooterColumn
          title="Ayuda"
          links={[
            { to: '/nosotros', label: 'Nosotros' },
            { to: '/contacto', label: 'Contacto' },
          ]}
        />
      </div>
      <div className="border-t border-vm-line px-4 py-4 text-center text-xs text-vm-muted sm:px-6">
        © {new Date().getFullYear()} Verde Mango. Todos los derechos reservados.
      </div>
    </footer>
  )
}
