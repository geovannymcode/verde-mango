import type { AdminOrderParams, AdminStatsParams } from '@/api/admin'
export const adminKeys = {
  all: ['admin'] as const,
  orders: () => [...adminKeys.all, 'orders'] as const,
  orderList: (params: AdminOrderParams) => [...adminKeys.orders(), 'list', params] as const,
  orderStats: (params: AdminStatsParams = {}) => [...adminKeys.orders(), 'stats', params] as const,
}
