import { Link, useNavigate } from 'react-router-dom'
import { DataTable, type DataColumn } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import type { OrderListResponse } from '@/api/schema'
import { useAdminOrders } from '@/features/admin/hooks'
import { useUrlFilters } from '@/hooks/useUrlFilters'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatCurrency, formatDateTime } from '@/lib/formatters'
import { statusLabels } from '@/lib/adminStatus'
import { orderStatuses } from '@/features/admin/orders/transitions'
import { ordersParams, bogotaToday } from '@/features/admin/orders/filters'
import { PaymentBadge } from '@/features/admin/orders/payment'
import { paymentLabels } from '@/features/admin/orders/paymentLabels'
export function OrdersPage() {
  useDocumentTitle(
    'Órdenes · Administración',
    'Gestiona los estados, pagos y envíos de las órdenes.',
  )
  const filters = useUrlFilters()
  const navigate = useNavigate()
  const params = ordersParams(filters.searchParams, filters.page)
  const query = useAdminOrders(params)
  const columns: DataColumn<OrderListResponse, 'createdAt' | 'totalAmount'>[] = [
    {
      id: 'number',
      header: 'Orden',
      cell: (row) => (
        <Link className="font-semibold text-vm-orange" to={`/admin/ordenes/${row.id}`}>
          {row.orderNumber}
        </Link>
      ),
    },
    {
      id: 'customer',
      header: 'Cliente',
      cell: (row) => (
        <div>
          <p>{row.customerName ?? 'Nombre no disponible'}</p>
          <p className="text-xs text-vm-muted">{row.customerEmail ?? 'Email no disponible'}</p>
        </div>
      ),
    },
    {
      id: 'date',
      header: 'Fecha',
      sortKey: 'createdAt',
      cell: (row) => formatDateTime(row.createdAt),
    },
    { id: 'items', header: 'Ítems', cell: (row) => row.itemCount },
    {
      id: 'total',
      header: 'Total',
      sortKey: 'totalAmount',
      cell: (row) => formatCurrency(row.totalAmount),
    },
    { id: 'payment', header: 'Pago', cell: (row) => <PaymentBadge status={row.paymentStatus} /> },
    { id: 'status', header: 'Estado de orden', cell: (row) => <StatusBadge status={row.status} /> },
  ]
  const preset = (values: Record<string, string | undefined>) =>
    filters.updateParams({
      estados: undefined,
      pago: undefined,
      desde: undefined,
      hasta: undefined,
      q: undefined,
      ...values,
    })
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Órdenes</h1>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => preset({ estados: 'PENDING' })}>
          Pendientes de pago
        </Button>
        <Button variant="outline" onClick={() => preset({ estados: 'CONFIRMED,PROCESSING' })}>
          Por enviar
        </Button>
        <Button
          variant="outline"
          onClick={() => preset({ desde: bogotaToday(), hasta: bogotaToday() })}
        >
          Hoy
        </Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-4">
        <Input
          id="order-search"
          label="Número de orden o email"
          value={filters.searchInput}
          onChange={(e) => filters.setSearchInput(e.target.value)}
        />
        <Select
          id="payment-filter"
          label="Estado de pago"
          value={filters.searchParams.get('pago') ?? ''}
          onChange={(e) => filters.updateParams({ pago: e.target.value })}
        >
          <option value="">Todos</option>
          {Object.entries(paymentLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Input
          id="order-from"
          type="date"
          label="Desde (Colombia)"
          value={filters.searchParams.get('desde') ?? ''}
          onChange={(e) => filters.updateParams({ desde: e.target.value })}
        />
        <Input
          id="order-until"
          type="date"
          label="Hasta (Colombia)"
          min={filters.searchParams.get('desde') || undefined}
          value={filters.searchParams.get('hasta') ?? ''}
          onChange={(e) => filters.updateParams({ hasta: e.target.value })}
        />
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Estados de orden</legend>
        <div className="flex flex-wrap gap-3">
          {orderStatuses.map((status) => (
            <label
              key={status}
              className="flex items-center gap-2 rounded-md border border-vm-line px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={params.statuses?.includes(status) ?? false}
                onChange={(e) =>
                  filters.updateParams({
                    estados: (e.target.checked
                      ? [...(params.statuses ?? []), status]
                      : params.statuses?.filter((s) => s !== status)
                    )?.join(','),
                  })
                }
              />
              {statusLabels[status]}
            </label>
          ))}
        </div>
      </fieldset>
      <Button variant="outline" onClick={filters.clearFilters}>
        Limpiar filtros
      </Button>
      <DataTable
        caption="Órdenes"
        columns={columns}
        rows={query.data?.content ?? []}
        rowKey={(r) => r.id}
        onRowClick={(r) => navigate(`/admin/ordenes/${r.id}`)}
        pagination={{
          page: filters.page,
          size: 20,
          totalElements: query.data?.totalElements ?? 0,
          totalPages: query.data?.totalPages ?? 0,
        }}
        onPageChange={(p) => filters.updateParams({ page: String(p) }, false)}
        sort={{
          key: params.sortBy === 'totalAmount' ? 'totalAmount' : 'createdAt',
          direction: params.sortDir === 'asc' ? 'asc' : 'desc',
        }}
        onSortChange={(s) => filters.updateParams({ orden: s.key, direccion: s.direction })}
        isLoading={query.isLoading}
        isFetching={query.isFetching}
        error={query.error}
        onRetry={() => void query.refetch()}
        emptyMessage="No hay órdenes que coincidan con los filtros."
      />
    </div>
  )
}
