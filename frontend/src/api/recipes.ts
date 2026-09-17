import { httpClient, unwrap } from './client'
import type { ApiResponse, PageResponse } from './types'
import type {
  RecipeListResponse,
  RecipeResponse,
  CategoryResponse,
  TagResponse,
  RatingResponse,
  RatingStatsResponse,
  CreateRatingRequest,
} from './schema'

export type RecipeDifficulty = RecipeResponse['difficulty']
export type CreateRecipeRatingRequest = CreateRatingRequest
export interface RecipeQueryParams {
  search?: string
  category?: string
  tag?: string
  difficulty?: RecipeDifficulty
  maxTime?: number
  page?: number
  size?: number
}
export interface RecipeRatingQueryParams {
  page?: number
  size?: number
}
const base = '/api/v1/recipes'
async function get<T>(path: string, params?: object): Promise<T> {
  return unwrap(await httpClient.get<ApiResponse<T>>(path, { params }))
}
export function getRecipes(params: RecipeQueryParams = {}) {
  const filtered = !!(
    params.search ||
    params.category ||
    params.tag ||
    params.difficulty ||
    params.maxTime != null
  )
  return get<PageResponse<RecipeListResponse>>(filtered ? `${base}/search` : base, {
    ...params,
    page: params.page ?? 0,
    size: params.size ?? 12,
  })
}
export const getRecipe = (slug: string) =>
  get<RecipeResponse>(`${base}/${encodeURIComponent(slug)}`)
export const getRecipeCategories = () => get<CategoryResponse[]>(`${base}/categories`)
export const getRecipeTags = () => get<TagResponse[]>(`${base}/tags`)
export const getRecentRecipes = (limit = 6) =>
  get<RecipeListResponse[]>(`${base}/latest`, { limit })
export const getRelatedRecipes = (slug: string, limit = 4) =>
  get<RecipeListResponse[]>(`${base}/${encodeURIComponent(slug)}/related`, { limit })
export const getRecipeRatings = (slug: string, params: RecipeRatingQueryParams = {}) =>
  get<PageResponse<RatingResponse>>(`${base}/${encodeURIComponent(slug)}/ratings`, {
    page: params.page ?? 0,
    size: params.size ?? 10,
  })
export const getRecipeRatingStats = (slug: string) =>
  get<RatingStatsResponse>(`${base}/${encodeURIComponent(slug)}/ratings/stats`)
export async function createRecipeRating(slug: string, payload: CreateRecipeRatingRequest) {
  return unwrap(
    await httpClient.post<ApiResponse<RatingResponse>>(
      `${base}/${encodeURIComponent(slug)}/ratings`,
      payload,
    ),
  )
}
