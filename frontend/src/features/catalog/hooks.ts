import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createProductRating,
  getCategories,
  getFeaturedProducts,
  getProductBySlug,
  getProductRatings,
  getProductRatingStats,
  getProducts,
  getRelatedProducts,
  type CreateProductRatingRequest,
  type ProductQueryParams,
  type ProductRatingQueryParams,
} from '@/api/catalog'
import { catalogKeys } from '@/features/catalog/keys'

export function useProducts(params: ProductQueryParams) {
  return useQuery({
    queryKey: catalogKeys.productList(params),
    queryFn: () => getProducts(params),
    placeholderData: keepPreviousData,
  })
}

export function useProduct(slug: string | undefined) {
  return useQuery({
    queryKey: catalogKeys.productDetail(slug ?? ''),
    queryFn: () => getProductBySlug(slug as string),
    enabled: !!slug,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: catalogKeys.categories(),
    queryFn: getCategories,
    staleTime: 5 * 60_000,
  })
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: catalogKeys.featuredProducts(),
    queryFn: getFeaturedProducts,
    staleTime: 5 * 60_000,
  })
}

export function useRelatedProducts(productId: number | undefined) {
  return useQuery({
    queryKey: catalogKeys.relatedProducts(productId ?? 0),
    queryFn: () => getRelatedProducts(productId as number),
    enabled: !!productId,
  })
}

export function useProductRatings(
  productId: number | undefined,
  params: ProductRatingQueryParams,
) {
  return useQuery({
    queryKey: catalogKeys.ratingsList(productId ?? 0, params),
    queryFn: () => getProductRatings(productId as number, params),
    enabled: !!productId,
    placeholderData: keepPreviousData,
  })
}

export function useProductRatingStats(productId: number | undefined) {
  return useQuery({
    queryKey: catalogKeys.ratingStats(productId ?? 0),
    queryFn: () => getProductRatingStats(productId as number),
    enabled: !!productId,
  })
}

export function useCreateRating(productId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateProductRatingRequest) =>
      createProductRating(productId as number, payload),
    onSuccess: () => {
      if (!productId) return
      void queryClient.invalidateQueries({ queryKey: catalogKeys.ratings(productId) })
    },
  })
}
