import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/api/adminCatalog'
import type { CreateProductRequest, UpdateProductRequest } from '@/api/schema'
import { ApiError } from '@/api/types'
import { adminCatalogKeys } from './catalogKeys'
import { invalidateCatalog, publishCatalogChange } from './catalogSync'
const retry = (count: number, error: Error) =>
  !(error instanceof ApiError && [401, 403, 404].includes(error.status ?? 0)) && count < 1
export const useAdminProducts = (params: api.AdminProductParams) =>
  useQuery({
    queryKey: adminCatalogKeys.productList(params),
    queryFn: () => api.listAdminProducts(params),
    placeholderData: keepPreviousData,
    retry,
  })
export const useAdminProduct = (id: number) =>
  useQuery({
    queryKey: adminCatalogKeys.productDetail(id),
    queryFn: () => api.getAdminProduct(id),
    enabled: Number.isSafeInteger(id) && id > 0,
    retry,
  })
export const useAdminCategories = (params: api.AdminCategoryParams = {}) =>
  useQuery({
    queryKey: adminCatalogKeys.categoryList(params),
    queryFn: () => api.listAdminCategories(params),
    retry,
  })
function useCatalogMutation<T, R>(mutationFn: (value: T) => Promise<R>) {
  const client = useQueryClient()
  return useMutation({
    mutationFn,
    onSettled: async () => {
      publishCatalogChange()
      await invalidateCatalog(client)
    },
  })
}
export function useSaveProduct() {
  return useCatalogMutation(
    async ({
      id,
      data,
      imageUrls,
    }: {
      id?: number
      data: UpdateProductRequest
      imageUrls: string[]
    }) => {
      if (id === undefined) {
        const payload: CreateProductRequest = {
          name: data.name!,
          slug: data.slug,
          description: data.description,
          price: data.price!,
          stock: data.stock!,
          categoryId: data.categoryId,
          featured: data.featured ?? false,
          active: data.active ?? true,
          imageUrls,
          lowStockThreshold: 5,
          trackInventory: true,
          allowBackorder: false,
        }
        return api.createAdminProduct(payload)
      }
      // Re-read before applying the image diff so retrying a partially failed save cannot duplicate images.
      const current = await api.getAdminProduct(id)
      await api.updateAdminProduct(id, data)
      const images = [...current.images]
      for (const image of current.images) {
        if (!imageUrls.includes(image.url)) {
          await api.removeProductImage(id, image.id)
          images.splice(
            images.findIndex((item) => item.id === image.id),
            1,
          )
        }
      }
      for (const url of imageUrls) {
        if (!images.some((image) => image.url === url))
          images.push(await api.addProductImage(id, { url, isPrimary: false }))
      }
      const primary = images.find((image) => image.url === imageUrls[0])
      if (primary) await api.setPrimaryProductImage(id, primary.id)
      return api.getAdminProduct(id)
    },
  )
}
export const useDeleteProduct = () => useCatalogMutation(api.deleteAdminProduct)
export const useDeactivateProduct = () =>
  useCatalogMutation((id: number) => api.updateAdminProduct(id, { active: false }))
export const useSaveCategory = () =>
  useCatalogMutation(
    ({ id, data }: { id?: number; data: api.CreateCatalogCategory & { active?: boolean } }) =>
      id === undefined ? api.createAdminCategory(data) : api.updateAdminCategory(id, data),
  )
export const useDeleteCategory = () => useCatalogMutation(api.deleteAdminCategory)
export const useReorderCategories = () => useCatalogMutation(api.reorderAdminCategories)
