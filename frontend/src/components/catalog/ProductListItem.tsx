import { Link } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import type { CatalogProductCard } from '@/types/catalog'
import { formatCurrency } from '@/lib/formatters'
import { Rating } from '@/components/ui/Rating'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface ProductListItemProps {
  product: CatalogProductCard
}

export function ProductListItem({ product }: ProductListItemProps) {
  return (
    <article className="flex gap-4 rounded-vm-lg border border-vm-line bg-vm-white p-4 transition-shadow hover:shadow-vm-card">
      <Link
        to={`/tienda/${product.slug}`}
        className="relative block aspect-square w-28 shrink-0 overflow-hidden rounded-vm-md bg-vm-cream sm:w-36"
      >
        <img
          src={product.image ?? '/placeholder-product.svg'}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        {product.tag && (
          <Badge
            variant={
              product.tag === 'oferta' ? 'orange' : product.tag === 'nuevo' ? 'green' : 'neutral'
            }
            className="absolute left-2 top-2"
          >
            {product.tag}
          </Badge>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2">
        {product.category && (
          <p className="text-xs font-semibold uppercase tracking-wide text-vm-muted">
            {product.category}
          </p>
        )}
        <Link
          to={`/tienda/${product.slug}`}
          className="font-bold text-vm-ink hover:text-vm-orange"
        >
          {product.name}
        </Link>
        <Rating value={product.rating ?? 0} count={product.reviewCount} size={14} />
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-extrabold text-vm-ink">
              {formatCurrency(product.price)}
            </span>
            {product.compareAtPrice && (
              <span className="text-sm text-vm-muted line-through">
                {formatCurrency(product.compareAtPrice)}
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={!product.inStock}
            aria-label={`Agregar ${product.name} al carrito`}
          >
            <ShoppingBag size={16} />
            Agregar
          </Button>
        </div>
      </div>
    </article>
  )
}
