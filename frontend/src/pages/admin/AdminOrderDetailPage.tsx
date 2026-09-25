import { Link, useParams } from 'react-router-dom'
import { useAdminOrder } from '@/features/admin/orders/hooks'
import { OrderStatusControl } from '@/features/admin/orders/OrderStatusControl'
import { OrderTimeline } from '@/features/admin/orders/OrderTimeline'
import { PaymentBadge } from '@/features/admin/orders/payment'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { ApiError } from '@/api/types'
import { formatCurrency, formatDateTime } from '@/lib/formatters'
import { NotFoundPage } from '@/pages/NotFoundPage'
export function AdminOrderDetailPage() {
  const id = Number(useParams().id)
  const query = useAdminOrder(id)
  useDocumentTitle(
    query.data ? `Orden ${query.data.orderNumber}` : 'Detalle de orden',
    'Detalle, historial y gestión de la orden.',
  )
  if (
    !Number.isSafeInteger(id) ||
    id <= 0 ||
    (query.error instanceof ApiError && query.error.status === 404)
  )
    return <NotFoundPage />
  if (query.isPending)
    return (
      <div role="status" aria-label="Cargando orden" className="space-y-4">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  if (query.isError)
    return (
      <div role="alert">
        <p>{query.error.message}</p>
        <Button onClick={() => void query.refetch()}>Reintentar</Button>
      </div>
    )
  const order = query.data
  const address = order.shippingAddress
  const payment = order.payment
  return (
    <div className="space-y-8">
      <Link className="text-vm-orange" to="/admin/ordenes">
        ← Órdenes
      </Link>
      <header className="space-y-3">
        <h1 className="text-3xl font-bold break-words">Orden {order.orderNumber}</h1>
        <p>{formatDateTime(order.createdAt)}</p>
        <div className="flex flex-wrap gap-3">
          <StatusBadge status={order.status} />
          <PaymentBadge status={payment?.status} />
        </div>
      </header>
      <OrderStatusControl id={order.id} number={order.orderNumber} status={order.status} />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-vm-line p-5">
          <h2 className="mb-3 text-xl font-bold">Cliente</h2>
          <dl className="space-y-2 break-words">
            <dt className="font-semibold">Nombre</dt>
            <dd>{order.customerName ?? 'No disponible'}</dd>
            <dt className="font-semibold">Email de la compra</dt>
            <dd>{order.customerEmail ?? 'No disponible'}</dd>
            <dt className="font-semibold">Teléfono</dt>
            <dd>{order.customerPhone ?? 'No registrado'}</dd>
            <dt className="font-semibold">Documento de facturación</dt>
            <dd>{order.customerDocument ?? 'No registrado'}</dd>
          </dl>
        </section>
        <section className="rounded-lg border border-vm-line p-5">
          <h2 className="mb-3 text-xl font-bold">Envío</h2>
          <p>
            {address.recipientName} · {address.phone}
          </p>
          <p>
            {address.streetAddress}
            {address.apartment ? `, ${address.apartment}` : ''}
          </p>
          <p>
            {address.city}, {address.state} · {address.country} {address.postalCode}
          </p>
          {address.instructions && <p className="mt-3">Indicaciones: {address.instructions}</p>}
          {order.customerNotes && <p className="mt-3">Notas: {order.customerNotes}</p>}
          {order.trackingNumber && (
            <p className="mt-3">
              Guía: {order.trackingNumber} · {order.carrier}
            </p>
          )}
        </section>
      </div>
      <section>
        <h2 className="text-xl font-bold">Ítems de la orden</h2>
        <p className="mb-4 text-sm text-vm-muted">
          Precios históricos al momento de la compra; no son los precios actuales del catálogo.
        </p>
        <div
          className="overflow-x-auto rounded-lg border border-vm-line"
          tabIndex={0}
          role="region"
          aria-label="Ítems históricos"
        >
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                {['Producto', 'Cantidad', 'Precio unitario histórico', 'Subtotal'].map((t) => (
                  <th key={t} className="p-4">
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-t border-vm-line">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        loading="lazy"
                        src={item.productImageUrl || '/placeholder-product.svg'}
                        alt=""
                        className="aspect-square h-14 w-14 rounded object-cover"
                      />
                      <span>{item.productName}</span>
                    </div>
                  </td>
                  <td className="p-4">{item.quantity}</td>
                  <td className="p-4 whitespace-nowrap">{formatCurrency(item.unitPrice)}</td>
                  <td className="p-4 whitespace-nowrap">{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <dl className="ml-auto mt-4 max-w-md space-y-2">
          {[
            ['Subtotal', order.subtotal],
            ['Envío', order.shippingCost],
            ...(order.discountAmount ? [['Descuentos', -order.discountAmount] as const] : []),
            ...(order.taxAmount ? [['Impuestos', order.taxAmount] as const] : []),
            ['Total', order.totalAmount],
          ].map(([label, amount]) => (
            <div key={label} className="flex justify-between gap-4">
              <dt>{label}</dt>
              <dd className="font-semibold">{formatCurrency(Number(amount))}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="rounded-lg border border-vm-line p-5">
        <h2 className="mb-3 text-xl font-bold">Pago</h2>
        {payment ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt>Pasarela</dt>
              <dd>{payment.gateway}</dd>
            </div>
            <div>
              <dt>Referencia</dt>
              <dd className="break-all">{payment.reference}</dd>
            </div>
            <div>
              <dt>ID externo de transacción</dt>
              <dd className="break-all">{payment.transactionId ?? 'No registrado'}</dd>
            </div>
            <div>
              <dt>Método</dt>
              <dd>{payment.method ?? 'No registrado'}</dd>
            </div>
            <div>
              <dt>Estado del pago</dt>
              <dd>
                <PaymentBadge status={payment.status} />
              </dd>
            </div>
            <div>
              <dt>Fecha de procesamiento</dt>
              <dd>{payment.processedAt ? formatDateTime(payment.processedAt) : 'No registrada'}</dd>
            </div>
          </dl>
        ) : (
          <p>No hay una transacción de pasarela registrada para esta orden.</p>
        )}
        <div className="mt-4 text-sm text-vm-muted">
          <p>Referencia guardada en la orden: {order.paymentReference ?? 'No registrada'}</p>
          <p>Método guardado: {order.paymentMethod ?? 'No registrado'}</p>
          <p>
            Fecha de pago registrada en la orden:{' '}
            {order.paidAt ? formatDateTime(order.paidAt) : 'No registrada'}
          </p>
          <p className="mt-2">
            Estos datos de la orden no certifican una transacción Wompi; la confirmación
            administrativa también puede registrar una fecha de pago.
          </p>
        </div>
      </section>
      <OrderTimeline history={order.statusHistory} current={order.status} />
    </div>
  )
}
