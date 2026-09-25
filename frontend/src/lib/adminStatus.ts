import { orderStatusLabels, orderStatusColors } from '@/features/admin/orders/transitions'
import type { OrderStatus, RecipeResponse } from '@/api/schema'
export type AdminStatus = OrderStatus | RecipeResponse['status'] | 'ACTIVE' | 'INACTIVE'
export const statusLabels: Record<AdminStatus, string> = {
  ...orderStatusLabels,
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicada',
  ARCHIVED: 'Archivada',
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
}

export const statusColors: Record<AdminStatus, string> = {
  ...orderStatusColors,
  DRAFT: 'bg-stone-50 text-stone-800 border-stone-300',
  PUBLISHED: 'bg-green-50 text-green-900 border-green-300',
  ARCHIVED: 'bg-slate-50 text-slate-800 border-slate-300',
  ACTIVE: 'bg-green-50 text-green-900 border-green-300',
  INACTIVE: 'bg-stone-50 text-stone-800 border-stone-300',
}
