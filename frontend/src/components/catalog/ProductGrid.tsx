import type { CatalogProductCard } from '@/types/catalog'
import { ProductCard } from '@/components/catalog/ProductCard'

interface ProductGridProps {
  products: CatalogProductCard[]
  columns?: '2-3-4' | '1-2-3'
}

export function ProductGrid({ products, columns = '2-3-4' }: ProductGridProps) {
  const gridClass =
    columns === '1-2-3'
      ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
      : 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'

  return (
    <div className={gridClass}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
