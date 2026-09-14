import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addCartItem,
  cancelOrder,
  clearCart,
  createCheckout,
  getCart,
  getOrder,
  getOrders,
  mergeCart,
  removeCartItem,
  updateCartItem,
  validateCheckout,
  type OrderListParams,
} from '@/api/orders'
import type {
  CancelOrderRequest,
  CartItemResponse,
  CartResponse,
  CheckoutRequest,
  OrderResponse,
} from '@/api/schema'
import { useCartStore } from '@/store/cartStore'
import { useUiStore } from '@/store/uiStore'
import { cartKeys, orderKeys } from '@/features/cart/keys'

// ==================== Cart ====================

export function useCart() {
  return useQuery({
    queryKey: cartKeys.detail(),
    queryFn: getCart,
    staleTime: 30_000,
  })
}

interface AddToCartProductPreview {
  name: string
  slug: string
  imageUrl: string | null
  price: number
}

interface AddToCartVariables {
  productId: number
  quantity: number
  product?: AddToCartProductPreview
}

function recalculateTotals(cart: CartResponse): CartResponse {
  const subtotal = cart.items.reduce((sum, item) => sum + item.subtotal, 0)
  return {
    ...cart,
    subtotal,
    subtotalFormatted: cart.subtotalFormatted,
    itemCount: cart.items.length,
    totalQuantity: cart.items.reduce((sum, item) => sum + item.quantity, 0),
  }
}

export function useAddToCart() {
  const queryClient = useQueryClient()
  const openDrawer = useCartStore((state) => state.openDrawer)

  return useMutation({
    mutationFn: (variables: AddToCartVariables) =>
      addCartItem({ productId: variables.productId, quantity: variables.quantity }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: cartKeys.detail() })
      const previous = queryClient.getQueryData<CartResponse>(cartKeys.detail())

      if (previous && variables.product) {
        const existing = previous.items.find((item) => item.productId === variables.productId)
        let items: CartItemResponse[]

        if (existing) {
          items = previous.items.map((item) =>
            item.productId === variables.productId
              ? {
                  ...item,
                  quantity: item.quantity + variables.quantity,
                  subtotal: item.unitPrice * (item.quantity + variables.quantity),
                }
              : item,
          )
        } else {
          const optimisticItem: CartItemResponse = {
            id: -Date.now(),
            productId: variables.productId,
            productName: variables.product.name,
            productSlug: variables.product.slug,
            productImageUrl: variables.product.imageUrl ?? undefined,
            quantity: variables.quantity,
            unitPrice: variables.product.price,
            unitPriceFormatted: '',
            subtotal: variables.product.price * variables.quantity,
            subtotalFormatted: '',
          }
          items = [...previous.items, optimisticItem]
        }

        queryClient.setQueryData<CartResponse>(
          cartKeys.detail(),
          recalculateTotals({ ...previous, items }),
        )
      }

      openDrawer()
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(cartKeys.detail(), context.previous)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: cartKeys.detail() })
    },
  })
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: number; quantity: number }) =>
      updateCartItem(productId, { quantity }),
    onMutate: async ({ productId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: cartKeys.detail() })
      const previous = queryClient.getQueryData<CartResponse>(cartKeys.detail())

      if (previous) {
        const items = previous.items.map((item) =>
          item.productId === productId
            ? { ...item, quantity, subtotal: item.unitPrice * quantity }
            : item,
        )
        queryClient.setQueryData<CartResponse>(
          cartKeys.detail(),
          recalculateTotals({ ...previous, items }),
        )
      }

      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(cartKeys.detail(), context.previous)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: cartKeys.detail() })
    },
  })
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (productId: number) => removeCartItem(productId),
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: cartKeys.detail() })
      const previous = queryClient.getQueryData<CartResponse>(cartKeys.detail())

      if (previous) {
        const items = previous.items.filter((item) => item.productId !== productId)
        queryClient.setQueryData<CartResponse>(
          cartKeys.detail(),
          recalculateTotals({ ...previous, items }),
        )
      }

      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(cartKeys.detail(), context.previous)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: cartKeys.detail() })
    },
  })
}

export function useClearCart() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: clearCart,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: cartKeys.detail() })
      const previous = queryClient.getQueryData<CartResponse>(cartKeys.detail())

      if (previous) {
        queryClient.setQueryData<CartResponse>(
          cartKeys.detail(),
          recalculateTotals({ ...previous, items: [] }),
        )
      }

      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(cartKeys.detail(), context.previous)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: cartKeys.detail() })
    },
  })
}

export function useMergeCart() {
  const queryClient = useQueryClient()
  const clearGuestSessionId = useCartStore((state) => state.clearGuestSessionId)
  const pushToast = useUiStore((state) => state.pushToast)

  return useMutation({
    mutationFn: mergeCart,
    onSuccess: () => {
      clearGuestSessionId()
      void queryClient.invalidateQueries({ queryKey: cartKeys.detail() })
    },
    onError: (error) => {
      // La fusión del carrito nunca debe romper el login: se registra y se avisa sin bloquear.
      console.error('No se pudo fusionar el carrito de invitado', error)
      pushToast({
        message: 'No pudimos combinar tu carrito anterior. Revisa tu carrito actual.',
        variant: 'error',
      })
    },
  })
}

// ==================== Checkout ====================

export function useCheckoutValidation(enabled: boolean) {
  return useQuery({
    queryKey: cartKeys.checkoutValidation(),
    queryFn: validateCheckout,
    enabled,
  })
}

export function useCheckout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CheckoutRequest) => createCheckout(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cartKeys.detail() })
      void queryClient.invalidateQueries({ queryKey: orderKeys.all })
    },
  })
}

// ==================== Orders ====================

export function useOrders(params: OrderListParams) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => getOrders(params),
  })
}

interface UseOrderOptions {
  refetchInterval?:
    | number
    | false
    | ((query: { state: { data?: OrderResponse } }) => number | false)
}

export function useOrder(orderNumber: string | undefined, options: UseOrderOptions = {}) {
  return useQuery({
    queryKey: orderKeys.detail(orderNumber ?? ''),
    queryFn: () => getOrder(orderNumber as string),
    enabled: !!orderNumber,
    refetchInterval: options.refetchInterval,
  })
}

export function useCancelOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderNumber, payload }: { orderNumber: string; payload: CancelOrderRequest }) =>
      cancelOrder(orderNumber, payload),
    onSuccess: (order) => {
      queryClient.setQueryData(orderKeys.detail(order.orderNumber), order)
      void queryClient.invalidateQueries({ queryKey: orderKeys.all })
    },
  })
}
