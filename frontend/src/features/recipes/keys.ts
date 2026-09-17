import type { RecipeQueryParams, RecipeRatingQueryParams } from '@/api/recipes'
export const recipeKeys = {
  all: ['recipes'] as const,
  recipes: () => [...recipeKeys.all, 'recipes'] as const,
  recipeList: (params: RecipeQueryParams) => [...recipeKeys.recipes(), 'list', params] as const,
  recipeDetail: (slug: string) => [...recipeKeys.recipes(), 'detail', slug] as const,
  categories: () => [...recipeKeys.all, 'categories'] as const,
  tags: () => [...recipeKeys.all, 'tags'] as const,
  recent: (limit: number) => [...recipeKeys.recipes(), 'recent', limit] as const,
  related: (slug: string, limit: number) =>
    [...recipeKeys.recipes(), 'related', slug, limit] as const,
  ratings: (slug: string) => [...recipeKeys.all, 'ratings', slug] as const,
  ratingsList: (slug: string, params: RecipeRatingQueryParams) =>
    [...recipeKeys.ratings(slug), 'list', params] as const,
  ratingStats: (slug: string) => [...recipeKeys.ratings(slug), 'stats'] as const,
}
