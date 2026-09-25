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

export const statusColors: Record<AdminStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-900 border-amber-300',
  CONFIRMED: 'bg-blue-50 text-blue-900 border-blue-300',
  PROCESSING: 'bg-violet-50 text-violet-900 border-violet-300',
  SHIPPED: 'bg-cyan-50 text-cyan-900 border-cyan-300',
  DELIVERED: 'bg-green-50 text-green-900 border-green-300',
  CANCELLED: 'bg-red-50 text-red-900 border-red-300',
  REFUNDED: 'bg-pink-50 text-pink-900 border-pink-300',
  DRAFT: 'bg-stone-50 text-stone-800 border-stone-300',
  PUBLISHED: 'bg-green-50 text-green-900 border-green-300',
  ARCHIVED: 'bg-slate-50 text-slate-800 border-slate-300',
  ACTIVE: 'bg-green-50 text-green-900 border-green-300',
  INACTIVE: 'bg-stone-50 text-stone-800 border-stone-300',
}
