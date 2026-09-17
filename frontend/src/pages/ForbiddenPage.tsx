import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { Link } from 'react-router-dom'
import { buttonClasses } from '@/lib/buttonClasses'
import { SectionTitle } from '@/components/layout/SectionTitle'

export function ForbiddenPage() {
  useDocumentTitle('Acceso restringido', 'Tu cuenta no tiene acceso a esta sección de Verde Mango.')
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-6xl flex-col items-center justify-center gap-6 px-4 py-20 text-center sm:px-6">
      <SectionTitle
        align="center"
        eyebrow="403"
        title="No tienes permiso para ver esta página"
        description="Esta sección es solo para administradores."
      />
      <Link to="/" className={buttonClasses('solid-orange', 'md')}>
        Volver al inicio
      </Link>
    </div>
  )
}
