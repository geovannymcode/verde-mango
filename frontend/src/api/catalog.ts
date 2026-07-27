import { httpClient, unwrap } from './client'
import type { ApiResponse, PageResponse } from './types'
import type {
  CategorySummary,
  CategoryWithChildren,
  ProductListResponse,
  ProductResponse,
} from './schema'

// ==================== Rating types (definidos a mano) ====================
//
// NOTA: `catalog.web.RatingDtos.kt` y `recipes.web.RatingDtos.kt` declaran clases con el mismo
// nombre simple (RatingResponse, RatingStatsResponse, CreateRatingRequest). Springdoc colapsa
// ambas en un solo schema OpenAPI y solo sobrevive la versión de `recipes` en
// `openapi.gen.d.ts`. Por eso NO usamos los alias de `schema.ts` para ratings de producto: estos
// tipos están escritos a mano a partir de `catalog/web/RatingDtos.kt`.
// Ver docs/api-gaps.md para el detalle completo.

export interface ProductRatingResponse {
  id: number
  productId: number
  userId: number
  rating: number
  title: string | null
  comment: string | null
  verifiedPurchase: boolean
  helpfulCount: number
  createdAt: string
  updatedAt: string
}

export interface ProductRatingStatsResponse {
  totalRatings: number
  averageRating: number | null
  fiveStarCount: number
  fourStarCount: number
  threeStarCount: number
  twoStarCount: number
  oneStarCount: number
  fiveStarPercentage: number
  fourStarPercentage: number
  threeStarPercentage: number
  twoStarPercentage: number
  oneStarPercentage: number
}

export interface CreateProductRatingRequest {
  rating: number
  title?: string
  comment?: string
}

// ==================== Query params ====================

export type ProductSortBy = 'name' | 'price' | 'rating' | 'newest' | 'stock'
export type SortDir = 'asc' | 'desc'

export interface ProductQueryParams {
  category?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  search?: string
  page?: number
  size?: number
  sortBy?: ProductSortBy
  sortDir?: SortDir
}

export interface ProductRatingQueryParams {
  page?: number
  size?: number
  sortBy?: string
}

// ==================== Products ====================

export async function getProducts(
  params: ProductQueryParams = {},
): Promise<PageResponse<ProductListResponse>> {
  const response = await httpClient.get<ApiResponse<PageResponse<ProductListResponse>>>(
    '/api/v1/products',
    {
      params: {
        category: params.category,
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
        inStock: params.inStock,
        search: params.search,
        page: params.page ?? 0,
        size: params.size ?? 20,
        sortBy: params.sortBy ?? 'newest',
        sortDir: params.sortDir ?? 'desc',
      },
    },
  )
  return unwrap(response)
}

export async function getProductBySlug(slug: string): Promise<ProductResponse> {
  const response = await httpClient.get<ApiResponse<ProductResponse>>(
    `/api/v1/products/${slug}`,
  )
  return unwrap(response)
}

export async function getProductById(id: number): Promise<ProductResponse> {
  const response = await httpClient.get<ApiResponse<ProductResponse>>(
    `/api/v1/products/id/${id}`,
  )
  return unwrap(response)
}

export async function getFeaturedProducts(): Promise<ProductListResponse[]> {
  const response = await httpClient.get<ApiResponse<ProductListResponse[]>>(
    '/api/v1/products/featured',
  )
  return unwrap(response)
}

export async function getRelatedProducts(productId: number): Promise<ProductListResponse[]> {
  const response = await httpClient.get<ApiResponse<ProductListResponse[]>>(
    `/api/v1/products/${productId}/related`,
  )
  return unwrap(response)
}

// ==================== Categories ====================

export async function getCategories(): Promise<CategorySummary[]> {
  const response = await httpClient.get<ApiResponse<CategorySummary[]>>('/api/v1/categories')
  return unwrap(response)
}

export async function getCategoryMenu(): Promise<CategoryWithChildren[]> {
  const response = await httpClient.get<ApiResponse<CategoryWithChildren[]>>(
    '/api/v1/categories/menu',
  )
  return unwrap(response)
}

// ==================== Ratings ====================

export async function getProductRatings(
  productId: number,
  params: ProductRatingQueryParams = {},
): Promise<PageResponse<ProductRatingResponse>> {
  const response = await httpClient.get<ApiResponse<PageResponse<ProductRatingResponse>>>(
    `/api/v1/products/${productId}/ratings`,
    {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 10,
        sortBy: params.sortBy ?? 'createdAt',
      },
    },
  )
  return unwrap(response)
}

export async function getProductRatingStats(
  productId: number,
): Promise<ProductRatingStatsResponse> {
  const response = await httpClient.get<ApiResponse<ProductRatingStatsResponse>>(
    `/api/v1/products/${productId}/ratings/stats`,
  )
  return unwrap(response)
}

export async function createProductRating(
  productId: number,
  payload: CreateProductRatingRequest,
): Promise<ProductRatingResponse> {
  const response = await httpClient.post<ApiResponse<ProductRatingResponse>>(
    `/api/v1/products/${productId}/ratings`,
    payload,
  )
  return unwrap(response)
}
