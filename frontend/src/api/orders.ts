import { httpClient, unwrap } from './client'
import type { ApiResponse, PageResponse } from './types'
import type {
  AddToCartRequest,
  CancelOrderRequest,
  CartResponse,
  CheckoutRequest,
  CheckoutResponse,
  CheckoutValidationResponse,
  OrderListResponse,
  OrderResponse,
  UpdateCartItemRequest,
} from './schema'

// ==================== Cart ====================

export async function getCart(): Promise<CartResponse> {
  const response = await httpClient.get<ApiResponse<CartResponse>>('/api/v1/cart')
  return unwrap(response)
}

export async function addCartItem(payload: AddToCartRequest): Promise<CartResponse> {
  const response = await httpClient.post<ApiResponse<CartResponse>>('/api/v1/cart/items', payload)
  return unwrap(response)
}

export async function updateCartItem(
  productId: number,
  payload: UpdateCartItemRequest,
): Promise<CartResponse> {
  const response = await httpClient.put<ApiResponse<CartResponse>>(
    `/api/v1/cart/items/${productId}`,
    payload,
  )
  return unwrap(response)
}

export async function removeCartItem(productId: number): Promise<CartResponse> {
  const response = await httpClient.delete<ApiResponse<CartResponse>>(
    `/api/v1/cart/items/${productId}`,
  )
  return unwrap(response)
}

export async function clearCart(): Promise<CartResponse> {
  const response = await httpClient.delete<ApiResponse<CartResponse>>('/api/v1/cart')
  return unwrap(response)
}

export async function mergeCart(): Promise<CartResponse> {
  const response = await httpClient.post<ApiResponse<CartResponse>>('/api/v1/cart/merge')
  return unwrap(response)
}

// ==================== Checkout ====================

export async function validateCheckout(): Promise<CheckoutValidationResponse> {
  const response = await httpClient.post<ApiResponse<CheckoutValidationResponse>>(
    '/api/v1/checkout/validate',
  )
  return unwrap(response)
}

export async function createCheckout(payload: CheckoutRequest): Promise<CheckoutResponse> {
  const response = await httpClient.post<ApiResponse<CheckoutResponse>>('/api/v1/checkout', payload)
  return unwrap(response)
}

// ==================== Orders ====================

export interface OrderListParams {
  status?: string
  page?: number
  size?: number
}

export async function getOrders(
  params: OrderListParams = {},
): Promise<PageResponse<OrderListResponse>> {
  const response = await httpClient.get<ApiResponse<PageResponse<OrderListResponse>>>(
    '/api/v1/orders',
    {
      params: {
        status: params.status,
        page: params.page ?? 0,
        size: params.size ?? 10,
      },
    },
  )
  return unwrap(response)
}

export async function getOrder(orderNumber: string): Promise<OrderResponse> {
  const response = await httpClient.get<ApiResponse<OrderResponse>>(`/api/v1/orders/${orderNumber}`)
  return unwrap(response)
}

export async function cancelOrder(
  orderNumber: string,
  payload: CancelOrderRequest,
): Promise<OrderResponse> {
  const response = await httpClient.post<ApiResponse<OrderResponse>>(
    `/api/v1/orders/${orderNumber}/cancel`,
    payload,
  )
  return unwrap(response)
}
