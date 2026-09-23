import { httpClient, unwrap } from './client'
import type { components, operations } from './openapi.gen'
import type { ApiResponse, PageResponse } from './types'
import type { ProductResponse, CreateProductRequest, UpdateProductRequest } from './schema'
export type AdminProductParams = NonNullable<operations['listAdminProducts']['parameters']['query']>
export type AdminCategoryParams = NonNullable<operations['listAdminCategories']['parameters']['query']>
export type CatalogCategory = components['schemas']['CatalogCategoryResponse']
export type CreateCatalogCategory = components['schemas']['CatalogCreateCategoryRequest']
export type UpdateCatalogCategory = components['schemas']['CatalogUpdateCategoryRequest']
export type ReorderCategories = components['schemas']['ReorderCategoriesRequest']
export type ProductImageInput = components['schemas']['AddProductImageRequest']
const products = '/api/v1/admin/products'
const categories = '/api/v1/admin/categories'
export const listAdminProducts = async (params: AdminProductParams) => unwrap(await httpClient.get<ApiResponse<PageResponse<ProductResponse>>>(products, { params }))
export const getAdminProduct = async (id: number) => unwrap(await httpClient.get<ApiResponse<ProductResponse>>(`${products}/${id}`))
export const createAdminProduct = async (data: CreateProductRequest) => unwrap(await httpClient.post<ApiResponse<ProductResponse>>(products, data))
export const updateAdminProduct = async (id: number, data: UpdateProductRequest) => unwrap(await httpClient.put<ApiResponse<ProductResponse>>(`${products}/${id}`, data))
export const deleteAdminProduct = async (id: number) => { await httpClient.delete(`${products}/${id}`) }
/** URL metadata only. Replace this boundary if a file upload endpoint is introduced. */
export const addProductImage = async (id: number, data: ProductImageInput) => unwrap(await httpClient.post<ApiResponse<components['schemas']['ProductImageResponse']>>(`${products}/${id}/images`, data))
export const removeProductImage = async (id: number, imageId: number) => { await httpClient.delete(`${products}/${id}/images/${imageId}`) }
export const setPrimaryProductImage = async (id: number, imageId: number) => { await httpClient.patch(`${products}/${id}/images/${imageId}/primary`) }
export const listAdminCategories = async (params: AdminCategoryParams = {}) => unwrap(await httpClient.get<ApiResponse<CatalogCategory[]>>(categories, { params }))
export const createAdminCategory = async (data: CreateCatalogCategory) => unwrap(await httpClient.post<ApiResponse<CatalogCategory>>(categories, data))
export const updateAdminCategory = async (id: number, data: UpdateCatalogCategory) => unwrap(await httpClient.put<ApiResponse<CatalogCategory>>(`${categories}/${id}`, data))
export const deleteAdminCategory = async (id: number) => { await httpClient.delete(`${categories}/${id}`) }
export const reorderAdminCategories = async (data: ReorderCategories) => { await httpClient.post(`${categories}/reorder`, data) }
