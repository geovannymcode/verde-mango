import type { ProductQueryParams, ProductRatingQueryParams } from '@/api/catalog'

export const catalogKeys = {
  all: ['catalog'] as const,

  products: () => [...catalogKeys.all, 'products'] as const,
  productList: (params: ProductQueryParams) =>
    [...catalogKeys.products(), 'list', params] as const,
  productDetail: (slug: string) => [...catalogKeys.products(), 'detail', slug] as const,
  featuredProducts: () => [...catalogKeys.products(), 'featured'] as const,
  relatedProducts: (productId: number) =>
    [...catalogKeys.products(), 'related', productId] as const,

  categories: () => [...catalogKeys.all, 'categories'] as const,

  ratings: (productId: number) => [...catalogKeys.all, 'ratings', productId] as const,
  ratingsList: (productId: number, params: ProductRatingQueryParams) =>
    [...catalogKeys.ratings(productId), 'list', params] as const,
  ratingStats: (productId: number) => [...catalogKeys.ratings(productId), 'stats'] as const,
}
