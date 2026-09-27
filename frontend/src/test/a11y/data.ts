import {
  makeCart,
  makeCartItem,
  makeCategory,
  makeCheckoutValidation,
  makeOrder,
  makeProduct,
  makeProductListItem,
  makeRecipe,
  makeRecipeListItem,
  fixtureDate,
  type Schema,
} from '../msw/factories'
import { pageResponse } from '../msw/responses'
export const recipe = makeRecipe({
  ingredients: [
    {
      id: 1,
      name: 'Quinua',
      quantity: 2,
      unit: 'tazas',
      optional: false,
      formatted: '2 tazas de quinua',
      isLinkedToProduct: false,
    },
  ],
  steps: [{ id: 1, stepNumber: 1, instruction: 'Lavar la quinua y cocinar con agua.' }],
})
const category: Schema['CatalogCategoryResponse'] = {
  id: 1,
  name: 'Fermentos',
  slug: 'fermentos',
  active: true,
  sortOrder: 0,
  productCount: 0,
  createdAt: fixtureDate,
  updatedAt: fixtureDate,
}
const recipeCategory: Schema['CategoryResponse'] = {
  id: 1,
  name: 'Almuerzo',
  slug: 'almuerzo',
  active: true,
  displayOrder: 0,
  recipeCount: 1,
  children: [],
}
export function auditData(path: string): unknown {
  if (path === '/api/v1/cart') return makeCart({ items: [makeCartItem()] })
  if (path === '/api/v1/checkout/validate') return makeCheckoutValidation()
  if (path === '/api/v1/categories') return [makeCategory()]
  if (path === '/api/v1/admin/categories') return [category]
  if (path === '/api/v1/admin/products') return pageResponse([makeProduct()])
  if (path === '/api/v1/admin/products/1') return makeProduct()
  if (path === '/api/v1/products') return pageResponse([makeProductListItem()])
  if (path === '/api/v1/products/featured') return [makeProductListItem()]
  if (path.endsWith('/related')) return []
  if (path === '/api/v1/products/kimchi-prueba') return makeProduct()
  if (path === '/api/v1/recipes/categories') return [recipeCategory]
  if (path === '/api/v1/recipes/tags')
    return [
      { id: 1, name: 'Vegano', slug: 'vegano', recipeCount: 1 } satisfies Schema['TagResponse'],
    ]
  if (path.endsWith('/ratings/stats'))
    return {
      averageRating: 0,
      totalRatings: 0,
      distribution: {},
    } satisfies Schema['RatingStatsResponse']
  if (path.endsWith('/ratings')) return pageResponse([])
  if (
    path === '/api/v1/recipes' ||
    path === '/api/v1/recipes/search' ||
    path === '/api/v1/admin/recipes'
  )
    return pageResponse([makeRecipeListItem()])
  if (path === '/api/v1/recipes/latest') return [makeRecipeListItem()]
  if (path === '/api/v1/recipes/quinua-prueba' || path === '/api/v1/admin/recipes/1') return recipe
  if (path === '/api/v1/orders' || path === '/api/v1/admin/orders')
    return pageResponse<Schema['OrderListResponse']>([makeOrder()])
  if (path === '/api/v1/admin/orders/stats')
    return {
      totalOrders: 1,
      pendingOrders: 1,
      processingOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
    }
  if (path.startsWith('/api/v1/orders/') || path === '/api/v1/admin/orders/1')
    return makeOrder({ status: 'CONFIRMED' })
  throw new Error(`Missing audit fixture: ${path}`)
}
