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
