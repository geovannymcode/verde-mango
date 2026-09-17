import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useCancelOrder, useOrder } from '@/features/cart/hooks'
import { useUiStore } from '@/store/uiStore'
import { formatCurrency, formatDateTime } from '@/lib/formatters'
import { ApiError } from '@/api/types'
import type { OrderStatus } from '@/api/schema'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Modal } from '@/components/ui/Modal'
import { NotFoundPage } from '@/pages/NotFoundPage'

const STATUS_BADGE: Record<OrderStatus, 'orange' | 'green' | 'neutral' | 'danger'> = {
  PENDING: 'neutral',
  CONFIRMED: 'orange',
  PROCESSING: 'orange',
  SHIPPED: 'orange',
  DELIVERED: 'green',
  CANCELLED: 'danger',
  REFUNDED: 'danger',
}

// Espejo de OrderStatus.toLabel() en orders/web/OrderDtos.kt (el backend no manda un label por
// cada entrada del historial, solo para el estado actual de la orden).
const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pendiente de pago',
  CONFIRMED: 'Confirmada',
  PROCESSING: 'En preparación',
  SHIPPED: 'Enviada',
  DELIVERED: 'Entregada',
  CANCELLED: 'Cancelada',
  REFUNDED: 'Reembolsada',
}

export function OrderDetailPage() {
  useDocumentTitle('Detalle del pedido', 'Consulta los productos, el envío y el estado de tu pedido de Verde Mango.')
  const { orderNumber } = useParams<{ orderNumber: string }>()
  const orderQuery = useOrder(orderNumber)
  const cancelOrder = useCancelOrder()
  const pushToast = useUiStore((state) => state.pushToast)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [reason, setReason] = useState('')

  if (orderQuery.isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  // El backend devuelve 404 tanto si la orden no existe como si pertenece a otro usuario
  // (OrderService.getUserOrder filtra por userId), así que no se puede distinguir "no existe" de
  // "no es tuya" — ver docs/api-gaps.md.
  if (orderQuery.isError || !orderQuery.data) {
    return <NotFoundPage />
  }

  const order = orderQuery.data

  function submitCancel() {
    if (!orderNumber || reason.trim().length === 0) return
    cancelOrder.mutate(
      { orderNumber, payload: { reason: reason.trim() } },
      {
        onSuccess: () => {
          setCancelOpen(false)
          setReason('')
          pushToast({ message: 'Orden cancelada.', variant: 'success' })
        },
        onError: (error) => {
          const message = error instanceof ApiError ? error.message : 'No pudimos cancelar la orden.'
          pushToast({ message, variant: 'error' })
        },
      },
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/cuenta/ordenes"
        className="flex w-fit items-center gap-1 text-sm font-semibold text-vm-muted hover:text-vm-ink"
      >
        <ChevronLeft size={16} /> Mis órdenes
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-vm-ink">{order.orderNumber}</h1>
          <p className="text-sm text-vm-muted">Creada el {formatDateTime(order.createdAt)}</p>
        </div>
        <Badge variant={STATUS_BADGE[order.status]}>{order.statusLabel}</Badge>
      </div>

      <section className="rounded-vm-lg border border-vm-line p-4">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-vm-muted">Productos</h2>
        <ul className="flex flex-col divide-y divide-vm-line">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-3">
                {item.productImageUrl && (
                  <img
                    src={item.productImageUrl}
                    alt={item.productName}
                    className="h-14 w-14 rounded-vm-md object-cover"
                  />
                )}
                <div>
                  <p className="font-semibold text-vm-ink">{item.productName}</p>
                  <p className="text-sm text-vm-muted">
                    {item.quantity} × {item.unitPriceFormatted}
                  </p>
                </div>
              </div>
              <span className="font-semibold text-vm-ink">{item.subtotalFormatted}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-col gap-1 border-t border-vm-line pt-4 text-sm">
          <div className="flex justify-between text-vm-muted">
            <span>Subtotal</span>
            <span>{order.subtotalFormatted}</span>
          </div>
          <div className="flex justify-between text-vm-muted">
            <span>Envío</span>
            <span>{formatCurrency(order.shippingCost)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-vm-muted">
              <span>Descuento</span>
              <span>-{formatCurrency(order.discountAmount)}</span>
            </div>
          )}
          {order.taxAmount > 0 && (
            <div className="flex justify-between text-vm-muted">
              <span>Impuestos</span>
              <span>{formatCurrency(order.taxAmount)}</span>
            </div>
          )}
          <div className="mt-1 flex justify-between text-base font-bold text-vm-ink">
            <span>Total</span>
            <span>{order.totalFormatted}</span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section className="rounded-vm-lg border border-vm-line p-4">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-vm-muted">
            Envío
          </h2>
          <p className="text-sm text-vm-ink">{order.shippingAddress.formatted}</p>
          {order.trackingNumber && (
            <p className="mt-2 text-sm text-vm-muted">
              Guía: {order.trackingNumber} {order.carrier ? `(${order.carrier})` : ''}
            </p>
          )}
        </section>

        <section className="rounded-vm-lg border border-vm-line p-4">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-vm-muted">Pago</h2>
          <p className="text-sm text-vm-ink">
            {order.paymentMethod ?? 'Sin método registrado'}
          </p>
          {order.paidAt && (
            <p className="mt-1 text-sm text-vm-muted">Pagado el {formatDateTime(order.paidAt)}</p>
          )}
        </section>
      </div>

      <section className="rounded-vm-lg border border-vm-line p-4">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-vm-muted">
          Historial
        </h2>
        <ol className="flex flex-col gap-4 border-l border-vm-line pl-4">
          {order.statusHistory.map((entry) => (
            <li key={entry.id} className="relative">
              <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-vm-full bg-vm-orange" />
              <p className="text-sm font-semibold text-vm-ink">{STATUS_LABELS[entry.toStatus]}</p>
              <p className="text-xs text-vm-muted">{formatDateTime(entry.createdAt)}</p>
              {entry.comment && <p className="mt-1 text-sm text-vm-muted">{entry.comment}</p>}
            </li>
          ))}
        </ol>
      </section>

      {order.canBeCancelled && (
        <Button
          type="button"
          variant="outline"
          className="self-start"
          onClick={() => setCancelOpen(true)}
        >
          Cancelar orden
        </Button>
      )}

      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancelar orden">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-vm-muted">
            Cuéntanos por qué quieres cancelar la orden {order.orderNumber}.
          </p>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            maxLength={500}
            className="rounded-vm-md border border-vm-line p-3 text-sm focus-visible:border-vm-orange focus-visible:outline-none"
            placeholder="Motivo de la cancelación"
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setCancelOpen(false)}>
              Volver
            </Button>
            <Button
              type="button"
              disabled={reason.trim().length === 0 || cancelOrder.isPending}
              onClick={submitCancel}
            >
              {cancelOrder.isPending ? 'Cancelando…' : 'Confirmar cancelación'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
