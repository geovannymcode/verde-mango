import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/api/types'
import {
  getRecipes,
  getRecipe,
  getRecipeCategories,
  getRecipeTags,
  getRecentRecipes,
  getRelatedRecipes,
  getRecipeRatings,
  getRecipeRatingStats,
  createRecipeRating,
  type RecipeQueryParams,
  type RecipeRatingQueryParams,
  type CreateRecipeRatingRequest,
} from '@/api/recipes'
import { recipeKeys } from './keys'
export function useRecipes(params: RecipeQueryParams) {
  return useQuery({
    queryKey: recipeKeys.recipeList(params),
    queryFn: () => getRecipes(params),
    placeholderData: keepPreviousData,
  })
}
export function useRecipe(slug: string | undefined) {
  return useQuery({
    queryKey: recipeKeys.recipeDetail(slug ?? ''),
    queryFn: () => getRecipe(slug!),
    enabled: !!slug,
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  })
}
export function useRecipeCategories() {
  return useQuery({
    queryKey: recipeKeys.categories(),
    queryFn: getRecipeCategories,
    staleTime: 300_000,
  })
}
export function useRecipeTags() {
  return useQuery({ queryKey: recipeKeys.tags(), queryFn: getRecipeTags, staleTime: 300_000 })
}
export function useRecentRecipes(limit = 6) {
  return useQuery({
    queryKey: recipeKeys.recent(limit),
    queryFn: () => getRecentRecipes(limit),
    staleTime: 300_000,
  })
}
export function useRelatedRecipes(slug: string, limit = 4) {
  return useQuery({
    queryKey: recipeKeys.related(slug, limit),
    queryFn: () => getRelatedRecipes(slug, limit),
    enabled: !!slug,
  })
}
export function useRecipeRatings(slug: string, params: RecipeRatingQueryParams = {}) {
  return useQuery({
    queryKey: recipeKeys.ratingsList(slug, params),
    queryFn: () => getRecipeRatings(slug, params),
    enabled: !!slug,
    placeholderData: keepPreviousData,
  })
}
export function useRecipeRatingStats(slug: string) {
  return useQuery({
    queryKey: recipeKeys.ratingStats(slug),
    queryFn: () => getRecipeRatingStats(slug),
    enabled: !!slug,
  })
}
export function useCreateRecipeRating(slug: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateRecipeRatingRequest) => createRecipeRating(slug, payload),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: recipeKeys.ratings(slug) }),
        client.invalidateQueries({ queryKey: recipeKeys.recipes() }),
      ])
    },
  })
}
