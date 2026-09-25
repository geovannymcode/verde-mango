import type { OrderStatus } from '@/api/schema'

/** Fuente: common/domain/Constants.kt, OrderStatus.canTransitionTo; contrastado con
 * orders/service/OrderService.updateOrderStatus y Order.markAsShipped/markAsDelivered.
 * /api-docs no expone la máquina de estados. DELIVERED permite REFUNDED; este PATCH
 * solo cambia el estado de la orden, no ejecuta un reembolso en Wompi. */
export const orderTransitions = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
} as const satisfies Record<OrderStatus, readonly OrderStatus[]>
export const orderStatuses = Object.keys(orderTransitions) as OrderStatus[]
export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  const destinations: readonly OrderStatus[] = orderTransitions[from]
  return destinations.includes(to)
}

/** Etiquetas y colores compartidos por el panel y la cuenta del cliente. */
export const orderStatusLabels = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  PROCESSING: 'En preparación',
  SHIPPED: 'Enviada',
  DELIVERED: 'Entregada',
  CANCELLED: 'Cancelada',
  REFUNDED: 'Reembolsada',
} as const satisfies Record<OrderStatus, string>

export const orderStatusColors = {
  PENDING: 'bg-amber-50 text-amber-900 border-amber-300',
  CONFIRMED: 'bg-blue-50 text-blue-900 border-blue-300',
  PROCESSING: 'bg-violet-50 text-violet-900 border-violet-300',
  SHIPPED: 'bg-cyan-50 text-cyan-900 border-cyan-300',
  DELIVERED: 'bg-green-50 text-green-900 border-green-300',
  CANCELLED: 'bg-red-50 text-red-900 border-red-300',
  REFUNDED: 'bg-pink-50 text-pink-900 border-pink-300',
} as const satisfies Record<OrderStatus, string>
