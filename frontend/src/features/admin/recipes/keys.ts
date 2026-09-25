import type { AdminRecipeParams } from '@/api/adminRecipes'
export const adminRecipeKeys = {
  all: ['admin', 'recipes'] as const,
  list: (params: AdminRecipeParams) => [...adminRecipeKeys.all, 'list', params] as const,
  detail: (id: number) => [...adminRecipeKeys.all, 'detail', id] as const,
}
