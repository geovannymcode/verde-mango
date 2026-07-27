import type { ProductListResponse } from '@/api/schema'
import type { CatalogProductCard } from '@/types/catalog'

export function productListToCard(product: ProductListResponse): CatalogProductCard {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.categoryName,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    image: product.primaryImageUrl,
    rating: product.averageRating,
    reviewCount: product.ratingCount,
    inStock: product.isInStock,
    tag: product.featured ? 'nuevo' : product.discountPercentage > 0 ? 'oferta' : undefined,
  }
}
