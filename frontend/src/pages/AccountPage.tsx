import { Link, Navigate } from 'react-router-dom'
import { useOrders } from '@/features/cart/hooks'
import { useLogout } from '@/features/auth/hooks'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency } from '@/lib/formatters'
import { SectionTitle } from '@/components/layout/SectionTitle'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'

export function AccountPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const logout = useLogout()
  const ordersQuery = useOrders({ page: 0, size: 10 })

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: { pathname: '/cuenta' } }} replace />
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionTitle eyebrow="mi cuenta" title={user ? `Hola, ${user.firstName}` : 'Tu cuenta'} />
        <Button variant="outline" size="sm" onClick={() => logout.mutate()} disabled={logout.isPending}>
          Cerrar sesión
        </Button>
      </div>

      <h2 className="mt-10 mb-4 text-lg font-bold text-vm-ink">Mis pedidos</h2>

      {ordersQuery.isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : !ordersQuery.data || ordersQuery.data.content.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-vm-muted">
          <p>Todavía no tienes pedidos.</p>
          <Link to="/tienda">
            <Button variant="outline">Ir a la tienda</Button>
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {ordersQuery.data.content.map((order) => (
            <li
              key={order.orderNumber}
              className="flex flex-wrap items-center justify-between gap-3 rounded-vm-lg border border-vm-line p-4"
            >
              <div>
                <p className="font-semibold text-vm-ink">{order.orderNumber}</p>
                <p className="text-sm text-vm-muted">
                  {new Date(order.createdAt).toLocaleDateString('es-CO')}
                </p>
              </div>
              <Badge variant="neutral">{order.statusLabel}</Badge>
              <span className="font-bold text-vm-ink">{formatCurrency(order.totalAmount)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
