import { Link } from 'react-router-dom'
import { ShoppingBag, Trash2 } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useCart, useRemoveCartItem, useUpdateCartItem } from '@/features/cart/hooks'
import { formatCurrency } from '@/lib/formatters'
import { Drawer } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { QuantityStepper } from '@/components/cart/QuantityStepper'

export function CartDrawer() {
  const drawerOpen = useCartStore((state) => state.drawerOpen)
  const closeDrawer = useCartStore((state) => state.closeDrawer)

  const cartQuery = useCart()
  const updateItem = useUpdateCartItem()
  const removeItem = useRemoveCartItem()

  const items = cartQuery.data?.items ?? []

  return (
    <Drawer open={drawerOpen} onClose={closeDrawer} title="Tu carrito">
      {cartQuery.isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-vm-muted">
          <ShoppingBag size={40} className="text-vm-line" />
          <p className="text-sm">Tu carrito está vacío.</p>
          <Link to="/tienda" onClick={closeDrawer}>
            <Button variant="outline" size="sm">
              Ir a la tienda
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex h-full flex-col gap-4">
          <ul className="flex flex-1 flex-col gap-4 overflow-y-auto">
            {items.map((item) => {
              const isPending =
                (updateItem.isPending && updateItem.variables?.productId === item.productId) ||
                (removeItem.isPending && removeItem.variables === item.productId)

              return (
                <li key={item.productId} className="flex gap-3">
                  <img
                    src={item.productImageUrl ?? '/placeholder-product.svg'}
                    alt={item.productName}
                    loading="lazy"
                    className="h-16 w-16 shrink-0 rounded-vm-md bg-vm-cream object-cover"
                  />
                  <div className="flex flex-1 flex-col gap-1">
                    <Link
                      to={`/tienda/${item.productSlug}`}
                      onClick={closeDrawer}
                      className="line-clamp-2 text-sm font-semibold text-vm-ink hover:text-vm-orange"
                    >
                      {item.productName}
                    </Link>
                    <span className="text-sm font-bold text-vm-orange">
                      {formatCurrency(item.unitPrice)}
                    </span>
                    <div className="mt-1 flex items-center justify-between">
                      <QuantityStepper
                        quantity={item.quantity}
                        disabled={isPending}
                        onChange={(quantity) => updateItem.mutate({ productId: item.productId, quantity })}
                      />
                      <button
                        type="button"
                        aria-label={`Eliminar ${item.productName} del carrito`}
                        disabled={isPending}
                        onClick={() => removeItem.mutate(item.productId)}
                        className="text-vm-muted hover:text-red-500 disabled:opacity-30"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>

          <div className="flex flex-col gap-3 border-t border-vm-line pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-vm-ink">Subtotal</span>
              <span className="text-lg font-extrabold text-vm-ink">
                {formatCurrency(cartQuery.data?.subtotal ?? 0)}
              </span>
            </div>
            <Link to="/carrito" onClick={closeDrawer}>
              <Button variant="outline" size="md" className="w-full">
                Ver carrito
              </Button>
            </Link>
            <Link to="/checkout" onClick={closeDrawer}>
              <Button variant="solid-orange" size="md" className="w-full">
                Finalizar compra
              </Button>
            </Link>
          </div>
        </div>
      )}
    </Drawer>
  )
}
