import type { OrderListParams } from '@/api/orders'

export const cartKeys = {
  all: ['cart'] as const,
  detail: () => [...cartKeys.all, 'detail'] as const,
  checkoutValidation: () => [...cartKeys.all, 'checkout-validation'] as const,
}

export const orderKeys = {
  all: ['orders'] as const,
  list: (params: OrderListParams) => [...orderKeys.all, 'list', params] as const,
  detail: (orderNumber: string) => [...orderKeys.all, 'detail', orderNumber] as const,
}
