import { httpClient, unwrap } from './client'
import type { operations } from './openapi.gen'
import type { ApiResponse, PageResponse } from './types'
import type { OrderListResponse, OrderStatsResponse } from './schema'
export type AdminOrderParams = NonNullable<operations['getAllOrders']['parameters']['query']>
export type AdminStatsParams = NonNullable<operations['getStats_1']['parameters']['query']>
export async function getAdminOrders(params: AdminOrderParams = {}) {
  return unwrap(
    await httpClient.get<ApiResponse<PageResponse<OrderListResponse>>>('/api/v1/admin/orders', {
      params: { ...params, page: params.page ?? 0, size: params.size ?? 20 },
      paramsSerializer: { indexes: null },
    }),
  )
}
export async function getAdminOrderStats(params: AdminStatsParams = {}) {
  return unwrap(
    await httpClient.get<ApiResponse<OrderStatsResponse>>('/api/v1/admin/orders/stats', { params }),
  )
}

export async function getAdminOrder(id: number) {
  return unwrap(
    await httpClient.get<ApiResponse<import('./schema').OrderResponse>>(
      `/api/v1/admin/orders/${id}`,
    ),
  )
}
export async function updateAdminOrderStatus(
  id: number,
  payload: import('./schema').UpdateOrderStatusRequest,
) {
  return unwrap(
    await httpClient.patch<ApiResponse<import('./schema').OrderResponse>>(
      `/api/v1/admin/orders/${id}/status`,
      payload,
    ),
  )
}
