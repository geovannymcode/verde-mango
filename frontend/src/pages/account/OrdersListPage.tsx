import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useOrders } from '@/features/cart/hooks'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Pagination } from '@/components/ui/Pagination'



const PAGE_SIZE = 10

export function OrdersListPage() {
  useDocumentTitle('Mis pedidos', 'Consulta el historial y estado de tus pedidos de Verde Mango.')
  const [page, setPage] = useState(0)
  const ordersQuery = useOrders({ page, size: PAGE_SIZE })
  const data = ordersQuery.data

  if (ordersQuery.isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  if (!data || data.content.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-vm-lg border border-vm-line py-16 text-center text-vm-muted">
        <p>Todavía no tienes pedidos.</p>
        <Link to="/tienda">
          <Button variant="outline">Ir a la tienda</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {data.content.map((order) => (
          <li key={order.orderNumber}>
            <Link
              to={`/cuenta/ordenes/${order.orderNumber}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-vm-lg border border-vm-line p-4 transition-colors hover:border-vm-orange"
            >
              <div>
                <p className="font-semibold text-vm-ink">{order.orderNumber}</p>
                <p className="text-sm text-vm-muted">{formatDate(order.createdAt)}</p>
              </div>
              <StatusBadge status={order.status} />
              <span className="font-bold text-vm-ink">{formatCurrency(order.totalAmount)}</span>
            </Link>
          </li>
        ))}
      </ul>

      <Pagination page={page + 1} totalPages={data.totalPages} onPageChange={(p) => setPage(p - 1)} />
    </div>
  )
}
