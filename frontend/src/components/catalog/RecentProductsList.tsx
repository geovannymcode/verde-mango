import { Link } from 'react-router-dom'
import type { CatalogProductCard } from '@/types/catalog'
import { formatCurrency } from '@/lib/formatters'
import { Rating } from '@/components/ui/Rating'

interface RecentProductsListProps {
  products: CatalogProductCard[]
}

export function RecentProductsList({ products }: RecentProductsListProps) {
  if (products.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-bold uppercase tracking-wide text-vm-ink">Productos recientes</p>
      <ul className="flex flex-col gap-3">
        {products.map((product) => (
          <li key={product.id}>
            <Link to={`/tienda/${product.slug}`} className="group flex items-center gap-3">
              <img
                src={product.image ?? '/placeholder-product.svg'}
                alt={product.name}
                loading="lazy"
                className="h-14 w-14 shrink-0 rounded-vm-md bg-vm-cream object-cover"
              />
              <div className="flex flex-col gap-1">
                <span className="line-clamp-2 text-sm font-semibold text-vm-ink group-hover:text-vm-orange">
                  {product.name}
                </span>
                <span className="text-sm font-bold text-vm-orange">
                  {formatCurrency(product.price)}
                </span>
                <Rating value={product.rating ?? 0} size={12} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
