import { lazy } from 'react'

const loadAdmin = () => import('@/pages/admin/AdminPages')
export const CheckoutPage = lazy(() =>
  import('@/pages/CheckoutPage').then((module) => ({ default: module.CheckoutPage })),
)
export const CheckoutResultPage = lazy(() =>
  import('@/pages/CheckoutResultPage').then((module) => ({ default: module.CheckoutResultPage })),
)
export const RecipeDetailPage = lazy(() =>
  import('@/pages/RecipeDetailPage').then((module) => ({ default: module.RecipeDetailPage })),
)
export const AdminLayout = lazy(() =>
  loadAdmin().then((module) => ({ default: module.AdminLayout })),
)
export const ProductsPage = lazy(() =>
  loadAdmin().then((module) => ({ default: module.ProductsPage })),
)
export const ProductFormPage = lazy(() =>
  loadAdmin().then((module) => ({ default: module.ProductFormPage })),
)
export const CategoriesPage = lazy(() =>
  loadAdmin().then((module) => ({ default: module.CategoriesPage })),
)
export const OrdersPage = lazy(() => loadAdmin().then((module) => ({ default: module.OrdersPage })))
export const AdminOrderDetailPage = lazy(() =>
  loadAdmin().then((module) => ({ default: module.AdminOrderDetailPage })),
)
export const AdminRecipesPage = lazy(() =>
  loadAdmin().then((module) => ({ default: module.AdminRecipesPage })),
)
export const RecipeFormPage = lazy(() =>
  import('@/pages/admin/RecipeFormPage').then((module) => ({ default: module.RecipeFormPage })),
)
export const DashboardPage = lazy(() =>
  loadAdmin().then((module) => ({ default: module.DashboardPage })),
)
