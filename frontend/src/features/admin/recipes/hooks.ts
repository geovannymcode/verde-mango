import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/api/types'
import * as api from '@/api/adminRecipes'
import { adminRecipeKeys } from './keys'
import { invalidateRecipes, publishRecipeChange } from './sync'
const retry = (count: number, error: Error) =>
  !(error instanceof ApiError && [401, 403, 404].includes(error.status ?? 0)) && count < 1
export function useAdminRecipes(params: api.AdminRecipeParams) {
  return useQuery({
    queryKey: adminRecipeKeys.list(params),
    queryFn: () => api.listAdminRecipes(params),
    placeholderData: keepPreviousData,
    retry,
  })
}
export function useAdminRecipe(id: number | undefined) {
  return useQuery({
    queryKey: adminRecipeKeys.detail(id ?? 0),
    queryFn: () => api.getAdminRecipe(id!),
    enabled: id !== undefined && Number.isSafeInteger(id) && id > 0,
    retry,
  })
}
export type SaveIntent = 'draft' | 'publish' | 'save' | 'unpublish'
export function useSaveRecipe() {
  const client = useQueryClient()
  return useMutation({
    retry: false,
    mutationFn: async ({
      id,
      data,
      intent,
      onSaved,
    }: {
      id?: number
      data: api.CreateRecipe & api.UpdateRecipe
      intent: SaveIntent
      onSaved: (recipe: api.Recipe) => void
    }) => {
      let result = id ? await api.updateAdminRecipe(id, data) : await api.createAdminRecipe(data)
      onSaved(result)
      if (intent === 'publish') result = await api.publishAdminRecipe(result.id)
      if ((intent === 'draft' || intent === 'unpublish') && result.status === 'PUBLISHED')
        result = await api.unpublishAdminRecipe(result.id)
      return result
    },
    onSettled: async () => {
      publishRecipeChange()
      await invalidateRecipes(client)
    },
  })
}
export function useDeleteRecipe() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: api.deleteAdminRecipe,
    retry: false,
    onSuccess: async () => {
      publishRecipeChange()
      await invalidateRecipes(client)
    },
  })
}
