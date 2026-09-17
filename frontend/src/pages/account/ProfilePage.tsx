import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { AlertTriangle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { formatDate } from '@/lib/formatters'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

const ROLE_LABELS: Record<string, string> = {
  CUSTOMER: 'Cliente',
  ADMIN: 'Administrador',
  SUPER_ADMIN: 'Super administrador',
}

export function ProfilePage() {
  useDocumentTitle('Mi perfil', 'Consulta los datos de tu cuenta de Verde Mango.')
  const user = useAuthStore((state) => state.user)

  if (!user) return null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3 rounded-vm-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <AlertTriangle size={18} className="shrink-0" />
        <p>
          Editar el perfil todavía no está disponible: el backend no expone un endpoint para
          actualizarlo. Por ahora esta sección es solo de lectura.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant={user.role === 'CUSTOMER' ? 'neutral' : 'orange'}>
          {ROLE_LABELS[user.role] ?? user.role}
        </Badge>
        {user.emailVerified && <Badge variant="green">Correo verificado</Badge>}
      </div>

      <form className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Nombre" value={user.firstName} disabled readOnly />
        <Input label="Apellido" value={user.lastName} disabled readOnly />
        <Input label="Correo electrónico" value={user.email} disabled readOnly />
        <Input label="Teléfono" value={user.phone ?? '—'} disabled readOnly />
        <Input
          label="Miembro desde"
          value={formatDate(user.createdAt)}
          disabled
          readOnly
          className="sm:col-span-2"
        />
      </form>

      <Button type="button" disabled className="self-start" title="No disponible por ahora">
        Guardar cambios
      </Button>
    </div>
  )
}
