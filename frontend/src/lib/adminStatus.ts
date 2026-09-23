import type { OrderStatus, RecipeResponse } from '@/api/schema'
export type AdminStatus = OrderStatus | RecipeResponse['status'] | 'ACTIVE' | 'INACTIVE'
export const statusLabels: Record<AdminStatus, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  PROCESSING: 'En preparación',
  SHIPPED: 'Enviada',
  DELIVERED: 'Entregada',
  CANCELLED: 'Cancelada',
  REFUNDED: 'Reembolsada',
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicada',
  ARCHIVED: 'Archivada',
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
}
