import { useState } from 'react'
import { useProducts } from '@/features/catalog/hooks'
import { useAdminOrders, useAdminOrderStats } from '@/features/admin/hooks'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatCurrency, formatDateTime } from '@/lib/formatters'
import { adminErrorMessage } from '@/lib/adminErrors'
import { DataTable, type DataColumn } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { statusLabels } from '@/lib/adminStatus'
import { Button } from '@/components/ui/Button'
import type { OrderListResponse, OrderStatsResponse, OrderStatus } from '@/api/schema'
const columns: DataColumn<OrderListResponse>[] = [
  {
    id: 'number',
    header: 'Número',
    cell: (order) => <span className="whitespace-nowrap font-medium">{order.orderNumber}</span>,
  },
  {
    id: 'date',
    header: 'Fecha',
    cell: (order) => (
      <time dateTime={order.createdAt} className="whitespace-nowrap">
        {formatDateTime(order.createdAt)}
      </time>
    ),
  },
  { id: 'items', header: 'Ítems', cell: (order) => order.itemCount },
  {
    id: 'total',
    header: 'Total',
    cell: (order) => <span className="whitespace-nowrap">{formatCurrency(order.totalAmount)}</span>,
  },
  { id: 'status', header: 'Estado', cell: (order) => <StatusBadge status={order.status} /> },
]
const countedStatuses: {
  status: OrderStatus
  key: keyof Pick<
    OrderStatsResponse,
    'pendingOrders' | 'processingOrders' | 'deliveredOrders' | 'cancelledOrders'
  >
}[] = [
  { status: 'PENDING', key: 'pendingOrders' },
  { status: 'PROCESSING', key: 'processingOrders' },
  { status: 'DELIVERED', key: 'deliveredOrders' },
  { status: 'CANCELLED', key: 'cancelledOrders' },
]
function Metric({
  label,
  value,
  note,
  loading,
  error,
  onRetry,
}: {
  label: string
  value?: number
  note?: string
  loading?: boolean
  error?: unknown
  onRetry?: () => void
}) {
  return (
    <div className="min-w-0 rounded-lg border border-vm-line p-5">
      <p className="text-sm text-vm-muted">{label}</p>
      {loading ? (
        <p role="status" className="mt-3 text-sm">
          Cargando…
        </p>
      ) : error != null ? (
        <div role="alert" className="mt-3 space-y-3 text-sm">
          <p>{adminErrorMessage(error)}</p>
          {onRetry && (
            <Button size="sm" variant="outline" onClick={onRetry}>
              Reintentar
            </Button>
          )}
        </div>
      ) : (
        <p className="mt-3 text-3xl font-bold tabular-nums">
          {value === undefined ? '—' : new Intl.NumberFormat('es-CO').format(value)}
        </p>
      )}
      {note && <p className="mt-2 text-xs leading-relaxed text-vm-muted">{note}</p>}
    </div>
  )
}
function AdditionalStatus({ status }: { status: OrderStatus }) {
  const query = useAdminOrders({ status, page: 0, size: 1 })
  return (
    <Metric
      label={statusLabels[status]}
      value={query.data?.totalElements}
      loading={query.isPending}
      error={query.error}
      onRetry={() => void query.refetch()}
    />
  )
}
export function DashboardPage() {
  useDocumentTitle(
    'Dashboard de administración',
    'Resumen del catálogo activo y de las órdenes de Verde Mango.',
  )
  const [page, setPage] = useState(1)
  const products = useProducts({ page: 0, size: 1 })
  const stats = useAdminOrderStats()
  const orders = useAdminOrders({ page: page - 1, size: 5 })
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <p className="text-sm text-vm-muted">Administración</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Dashboard</h1>
        <p className="mt-2 text-sm text-vm-muted">
          Una vista general de tu catálogo y tus pedidos.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Metric
          label="Productos activos"
          value={products.data?.totalElements}
          note="El catálogo disponible no incluye productos inactivos."
          loading={products.isPending}
          error={products.error}
          onRetry={() => void products.refetch()}
        />
        <Metric
          label="Total de órdenes"
          value={stats.data?.totalOrders}
          note="Histórico completo."
          loading={stats.isPending}
          error={stats.error}
          onRetry={() => void stats.refetch()}
        />
      </div>
      <section className="space-y-4" aria-labelledby="order-states">
        <div>
          <h2 id="order-states" className="text-lg font-bold">
            Órdenes por estado
          </h2>
          <p className="mt-1 text-sm text-vm-muted">Conteos históricos, sin filtro de fecha.</p>
        </div>
        {stats.isError && (
          <div role="alert" className="rounded-lg border border-vm-line p-4 text-sm">
            <p>{adminErrorMessage(stats.error)}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => void stats.refetch()}
            >
              Reintentar estadísticas
            </Button>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {countedStatuses.map(({ status, key }) => (
            <Metric
              key={status}
              label={statusLabels[status]}
              value={stats.isError ? undefined : stats.data?.[key]}
              loading={stats.isPending}
            />
          ))}
          {(['CONFIRMED', 'SHIPPED', 'REFUNDED'] as const).map((status) => (
            <AdditionalStatus key={status} status={status} />
          ))}
        </div>
      </section>
      <section className="min-w-0 space-y-4">
        <div>
          <h2 className="text-lg font-bold">Órdenes recientes</h2>
          <p className="mt-1 text-sm text-vm-muted">De la más reciente a la más antigua.</p>
        </div>
        <DataTable
          caption="Órdenes recientes"
          columns={columns}
          rows={orders.data?.content ?? []}
          rowKey={(order) => order.id}
          pagination={{
            page,
            size: 5,
            totalElements: orders.data?.totalElements ?? 0,
            totalPages: orders.data?.totalPages ?? 0,
          }}
          onPageChange={setPage}
          isLoading={orders.isPending}
          isFetching={orders.isFetching}
          error={orders.error}
          onRetry={() => void orders.refetch()}
          emptyMessage="Todavía no hay órdenes."
        />
      </section>
    </div>
  )
}
