import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Minus, Plus, ShoppingBag } from 'lucide-react'
import { useProduct, useRelatedProducts } from '@/features/catalog/hooks'
import { productListToCard } from '@/lib/adapters'
import { formatCurrency } from '@/lib/formatters'
import { useUiStore } from '@/store/uiStore'
import { ApiError } from '@/api/types'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { SectionTitle } from '@/components/layout/SectionTitle'
import { ProductGallery } from '@/components/catalog/ProductGallery'
import { ProductGrid } from '@/components/catalog/ProductGrid'
import { ProductReviews } from '@/components/catalog/ProductReviews'
import { Rating } from '@/components/ui/Rating'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { Skeleton } from '@/components/ui/Skeleton'
import { NotFoundPage } from '@/pages/NotFoundPage'

export function ProductDetailPage() {
  const { slug } = useParams()
  const [quantity, setQuantity] = useState(1)
  const pushToast = useUiStore((state) => state.pushToast)

  const productQuery = useProduct(slug)
  const relatedQuery = useRelatedProducts(productQuery.data?.id)

  if (productQuery.isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2">
          <Skeleton className="aspect-square w-full rounded-vm-lg" />
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-8 w-1/4" />
          </div>
        </div>
      </div>
    )
  }

  if (productQuery.isError) {
    const status = productQuery.error instanceof ApiError ? productQuery.error.status : undefined
    if (status === 404) {
      return <NotFoundPage />
    }

    return (
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-20 text-center sm:px-6">
        <p className="text-vm-ink">No pudimos cargar este producto.</p>
        <Button variant="outline" size="sm" onClick={() => productQuery.refetch()}>
          Reintentar
        </Button>
      </div>
    )
  }

  const product = productQuery.data
  if (!product) return null

  function handleAddToCart() {
    console.log('Agregar al carrito', { productId: product?.id, quantity })
    pushToast({ message: `${product?.name} agregado al carrito (simulado).`, variant: 'success' })
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Breadcrumbs
        items={[
          { label: 'Inicio', to: '/' },
          { label: 'Tienda', to: '/tienda' },
          ...(product.category
            ? [{ label: product.category.name, to: `/tienda?categoria=${product.category.slug}` }]
            : []),
          { label: product.name },
        ]}
        className="mb-6"
      />

      <div className="grid gap-10 md:grid-cols-2">
        <ProductGallery images={product.images} productName={product.name} />

        <div className="flex flex-col gap-4">
          {product.category && (
            <span className="text-xs font-semibold uppercase tracking-wide text-vm-muted">
              {product.category.name}
            </span>
          )}
          <h1 className="text-2xl font-extrabold text-vm-ink sm:text-3xl">{product.name}</h1>
          <Rating value={product.averageRating ?? 0} count={product.ratingCount} size={18} />
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-extrabold text-vm-orange">
              {formatCurrency(product.price)}
            </span>
            {product.compareAtPrice && (
              <span className="text-base text-vm-muted line-through">
                {formatCurrency(product.compareAtPrice)}
              </span>
            )}
          </div>

          <div>
            <Badge variant={product.isInStock ? 'green' : 'danger'}>
              {product.isInStock ? 'En stock' : 'Agotado'}
            </Badge>
          </div>

          {product.shortDescription && <p className="text-vm-muted">{product.shortDescription}</p>}

          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-vm-full border border-vm-line">
              <button
                type="button"
                aria-label="Disminuir cantidad"
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                className="flex h-10 w-10 items-center justify-center text-vm-ink hover:bg-vm-cream"
              >
                <Minus size={16} />
              </button>
              <span
                className="w-10 text-center text-sm font-semibold text-vm-ink"
                aria-live="polite"
              >
                {quantity}
              </span>
              <button
                type="button"
                aria-label="Aumentar cantidad"
                onClick={() =>
                  setQuantity((current) => Math.min(product.stock || 99, current + 1))
                }
                className="flex h-10 w-10 items-center justify-center text-vm-ink hover:bg-vm-cream"
              >
                <Plus size={16} />
              </button>
            </div>
            <Button onClick={handleAddToCart} disabled={!product.isInStock} className="flex-1">
              <ShoppingBag size={18} />
              Agregar al carrito
            </Button>
          </div>
        </div>
      </div>

      <Tabs
        className="mt-12"
        tabs={[
          {
            id: 'descripcion',
            label: 'Descripción',
            content: (
              <p className="whitespace-pre-line text-vm-muted">
                {product.description ?? 'Este producto aún no tiene una descripción detallada.'}
              </p>
            ),
          },
          {
            id: 'info',
            label: 'Información adicional',
            content: (
              <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                {product.sku && (
                  <div>
                    <dt className="font-semibold text-vm-ink">SKU</dt>
                    <dd className="text-vm-muted">{product.sku}</dd>
                  </div>
                )}
                {product.weightGrams && (
                  <div>
                    <dt className="font-semibold text-vm-ink">Peso</dt>
                    <dd className="text-vm-muted">{product.weightGrams} g</dd>
                  </div>
                )}
                <div>
                  <dt className="font-semibold text-vm-ink">Disponibilidad</dt>
                  <dd className="text-vm-muted">{product.isInStock ? 'En stock' : 'Agotado'}</dd>
                </div>
              </dl>
            ),
          },
          {
            id: 'resenas',
            label: 'Reseñas',
            content: <ProductReviews productId={product.id} />,
          },
        ]}
      />

      {relatedQuery.data && relatedQuery.data.length > 0 && (
        <section className="mt-16">
          <SectionTitle eyebrow="también te puede gustar" title="Productos relacionados" />
          <div className="mt-6">
            <ProductGrid products={relatedQuery.data.map(productListToCard)} columns="1-2-3" />
          </div>
        </section>
      )}
    </div>
  )
}
