import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useAuthStore } from '@/store/authStore'
import { SectionTitle } from '@/components/layout/SectionTitle'

// Scaffold: aún no hay panel de administración construido (fuera del alcance de la fase actual
// de autenticación). Esta página solo demuestra que AdminRoute filtra correctamente por rol.
export function AdminPlaceholderPage() {
  useDocumentTitle('Administración', 'Área de administración de Verde Mango.')
  const user = useAuthStore((state) => state.user)

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <SectionTitle
        eyebrow="admin"
        title={`Bienvenido, ${user?.fullName ?? 'administrador'}`}
        description="El panel de administración se construirá en una fase posterior. Esta ruta ya está protegida por rol."
      />
    </div>
  )
}
