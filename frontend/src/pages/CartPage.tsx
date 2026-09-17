import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { Link } from 'react-router-dom'
import { ShoppingBag, Trash2 } from 'lucide-react'
import { useCart, useClearCart, useRemoveCartItem, useUpdateCartItem } from '@/features/cart/hooks'
import { formatCurrency } from '@/lib/formatters'
import { SectionTitle } from '@/components/layout/SectionTitle'
import { QuantityStepper } from '@/components/cart/QuantityStepper'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'

export function CartPage() {
  useDocumentTitle('Mi carrito', 'Revisa los productos, cantidades y total de tu carrito de Verde Mango.')
  const cartQuery = useCart()
  const updateItem = useUpdateCartItem()
  const removeItem = useRemoveCartItem()
  const clearCart = useClearCart()

  const items = cartQuery.data?.items ?? []

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <SectionTitle eyebrow="carrito" title="Tu carrito de compras" />

      {cartQuery.isLoading ? (
        <div className="mt-8 flex flex-col gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-3 py-16 text-center text-vm-muted">
          <ShoppingBag size={48} className="text-vm-line" />
          <p>Tu carrito está vacío.</p>
          <Link to="/tienda">
            <Button variant="outline">Ir a la tienda</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-8 md:flex-row">
          <ul className="flex flex-1 flex-col gap-4">
            {items.map((item) => {
              const isPending =
                (updateItem.isPending && updateItem.variables?.productId === item.productId) ||
                (removeItem.isPending && removeItem.variables === item.productId)

              return (
                <li
                  key={item.productId}
                  className="flex gap-4 rounded-vm-lg border border-vm-line p-4"
                >
                  <img
                    src={item.productImageUrl ?? '/placeholder-product.svg'}
                    alt={item.productName}
                    loading="lazy"
                    className="h-20 w-20 shrink-0 rounded-vm-md bg-vm-cream object-cover"
                  />
                  <div className="flex flex-1 flex-col gap-1">
                    <Link
                      to={`/tienda/${item.productSlug}`}
                      className="font-semibold text-vm-ink hover:text-vm-orange"
                    >
                      {item.productName}
                    </Link>
                    <span className="text-sm font-bold text-vm-orange">
                      {formatCurrency(item.unitPrice)}
                    </span>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                      <QuantityStepper
                        quantity={item.quantity}
                        disabled={isPending}
                        onChange={(quantity) =>
                          updateItem.mutate({ productId: item.productId, quantity })
                        }
                      />
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-vm-ink">
                          {formatCurrency(item.subtotal)}
                        </span>
                        <button
                          type="button"
                          aria-label={`Eliminar ${item.productName} del carrito`}
                          disabled={isPending}
                          onClick={() => removeItem.mutate(item.productId)}
                          className="text-vm-muted hover:text-red-500 disabled:opacity-30"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>

          <div className="flex h-fit w-full flex-col gap-4 rounded-vm-lg border border-vm-line p-5 md:w-72">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-vm-ink">Subtotal</span>
              <span className="text-lg font-extrabold text-vm-ink">
                {formatCurrency(cartQuery.data?.subtotal ?? 0)}
              </span>
            </div>
            <Link to="/checkout">
              <Button variant="solid-orange" className="w-full">
                Finalizar compra
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              disabled={clearCart.isPending}
              onClick={() => clearCart.mutate()}
            >
              Vaciar carrito
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
