import { httpClient, unwrap } from './client'
import type { components, operations } from './openapi.gen'
import type { ApiResponse, PageResponse } from './types'
export type AdminRecipeParams = NonNullable<operations['getAllRecipes']['parameters']['query']>
export type Recipe = components['schemas']['RecipeResponse']
export type RecipeListItem = components['schemas']['RecipeListResponse']
export type CreateRecipe = components['schemas']['CreateRecipeRequest']
export type UpdateRecipe = components['schemas']['UpdateRecipeRequest']
const base = '/api/v1/admin/recipes'
export async function listAdminRecipes(params: AdminRecipeParams) {
  return unwrap(await httpClient.get<ApiResponse<PageResponse<RecipeListItem>>>(base, { params }))
}
export async function getAdminRecipe(id: number) {
  return unwrap(await httpClient.get<ApiResponse<Recipe>>(`${base}/${id}`))
}
export async function createAdminRecipe(data: CreateRecipe) {
  return unwrap(await httpClient.post<ApiResponse<Recipe>>(base, data))
}
export async function updateAdminRecipe(id: number, data: UpdateRecipe) {
  return unwrap(await httpClient.put<ApiResponse<Recipe>>(`${base}/${id}`, data))
}
export async function publishAdminRecipe(id: number) {
  return unwrap(await httpClient.patch<ApiResponse<Recipe>>(`${base}/${id}/publish`))
}
export async function unpublishAdminRecipe(id: number) {
  return unwrap(await httpClient.patch<ApiResponse<Recipe>>(`${base}/${id}/unpublish`))
}
export async function deleteAdminRecipe(id: number) {
  await httpClient.delete(`${base}/${id}`)
}
