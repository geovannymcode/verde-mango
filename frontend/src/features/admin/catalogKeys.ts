import type { AdminProductParams, AdminCategoryParams } from '@/api/adminCatalog'
export const adminCatalogKeys = {
  all: ['admin', 'catalog'] as const,
  products: () => [...adminCatalogKeys.all, 'products'] as const,
  productList: (params: AdminProductParams) => [...adminCatalogKeys.products(), 'list', params] as const,
  productDetail: (id: number) => [...adminCatalogKeys.products(), 'detail', id] as const,
  categories: () => [...adminCatalogKeys.all, 'categories'] as const,
  categoryList: (params: AdminCategoryParams) => [...adminCatalogKeys.categories(), params] as const,
}
