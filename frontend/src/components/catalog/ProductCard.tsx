import { Link } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import type { CatalogProductCard } from '@/types/catalog'
import { formatCurrency } from '@/lib/formatters'
import { Badge } from '@/components/ui/Badge'
import { Rating } from '@/components/ui/Rating'
import { Button } from '@/components/ui/Button'

interface ProductCardProps {
  product: CatalogProductCard
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-vm-lg border border-vm-line bg-vm-white transition-shadow hover:shadow-vm-card">
      <Link
        to={`/tienda/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-vm-cream"
      >
        <img
          src={product.image ?? '/placeholder-product.svg'}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {product.tag && (
          <Badge
            variant={
              product.tag === 'oferta' ? 'orange' : product.tag === 'nuevo' ? 'green' : 'neutral'
            }
            className="absolute left-3 top-3"
          >
            {product.tag}
          </Badge>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {product.category && (
          <p className="text-xs font-semibold uppercase tracking-wide text-vm-muted">
            {product.category}
          </p>
        )}
        <Link
          to={`/tienda/${product.slug}`}
          className="line-clamp-2 font-bold text-vm-ink hover:text-vm-orange"
        >
          {product.name}
        </Link>
        <Rating value={product.rating ?? 0} count={product.reviewCount} size={14} />
        <div className="mt-auto flex items-center justify-between pt-2">
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
            variant="ghost"
            size="sm"
            aria-label={`Agregar ${product.name} al carrito`}
            disabled={!product.inStock}
            className="!h-9 !w-9 !px-0"
          >
            <ShoppingBag size={18} />
          </Button>
        </div>
      </div>
    </article>
  )
}
