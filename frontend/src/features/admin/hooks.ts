import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  getAdminOrders,
  getAdminOrderStats,
  type AdminOrderParams,
  type AdminStatsParams,
} from '@/api/admin'
import { ApiError } from '@/api/types'
import { adminKeys } from './keys'
const retry = (attempt: number, error: Error) =>
  !(error instanceof ApiError && (error.status === 403 || error.status === 401)) && attempt < 1
export function useAdminOrders(params: AdminOrderParams) {
  return useQuery({
    queryKey: adminKeys.orderList(params),
    queryFn: () => getAdminOrders(params),
    placeholderData: keepPreviousData,
    retry,
  })
}
export function useAdminOrderStats(params: AdminStatsParams = {}) {
  return useQuery({
    queryKey: adminKeys.orderStats(params),
    queryFn: () => getAdminOrderStats(params),
    retry,
  })
}
