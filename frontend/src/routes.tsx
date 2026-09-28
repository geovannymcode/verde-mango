import {
  CheckoutPage,
  CheckoutResultPage,
  RecipeDetailPage,
  AdminLayout,
  ProductsPage,
  ProductFormPage,
  CategoriesPage,
  OrdersPage,
  AdminOrderDetailPage,
  AdminRecipesPage,
  RecipeFormPage,
  DashboardPage,
} from '@/components/routing/LazyPages'
import { RouteBoundary } from '@/components/routing/RouteBoundary'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RootLayout } from '@/components/layout/RootLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AdminRoute } from '@/components/auth/AdminRoute'
import { GuestRoute } from '@/components/auth/GuestRoute'
import { HomePage } from '@/pages/HomePage'
import { CatalogPage } from '@/pages/CatalogPage'
import { ProductDetailPage } from '@/pages/ProductDetailPage'
import { CartPage } from '@/pages/CartPage'
import { RecipesPage } from '@/pages/RecipesPage'
import { AccountLayout } from '@/pages/account/AccountLayout'
import { ProfilePage } from '@/pages/account/ProfilePage'
import { OrdersListPage } from '@/pages/account/OrdersListPage'
import { OrderDetailPage } from '@/pages/account/OrderDetailPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { AboutPage } from '@/pages/AboutPage'
import { ContactPage } from '@/pages/ContactPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { SetupStatusPage } from '@/pages/SetupStatusPage'

export const router = createBrowserRouter([
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <RouteBoundary>
          <AdminLayout />
        </RouteBoundary>
      </AdminRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <RouteBoundary>
            <DashboardPage />
          </RouteBoundary>
        ),
      },
      {
        path: 'productos',
        element: (
          <RouteBoundary>
            <ProductsPage />
          </RouteBoundary>
        ),
      },
      {
        path: 'productos/nuevo',
        element: (
          <RouteBoundary>
            <ProductFormPage />
          </RouteBoundary>
        ),
      },
      {
        path: 'productos/:id/editar',
        element: (
          <RouteBoundary>
            <ProductFormPage />
          </RouteBoundary>
        ),
      },
      {
        path: 'categorias',
        element: (
          <RouteBoundary>
            <CategoriesPage />
          </RouteBoundary>
        ),
      },
      {
        path: 'recetas',
        element: (
          <RouteBoundary>
            <AdminRecipesPage />
          </RouteBoundary>
        ),
      },
      {
        path: 'recetas/nueva',
        element: (
          <RouteBoundary>
            <RecipeFormPage />
          </RouteBoundary>
        ),
      },
      {
        path: 'recetas/:id/editar',
        element: (
          <RouteBoundary>
            <RecipeFormPage />
          </RouteBoundary>
        ),
      },
      {
        path: 'ordenes',
        element: (
          <RouteBoundary>
            <OrdersPage />
          </RouteBoundary>
        ),
      },
      {
        path: 'ordenes/:id',
        element: (
          <RouteBoundary>
            <AdminOrderDetailPage />
          </RouteBoundary>
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'tienda', element: <CatalogPage /> },
      { path: 'tienda/:slug', element: <ProductDetailPage /> },
      { path: 'carrito', element: <CartPage /> },
      {
        path: 'checkout',
        element: (
          <ProtectedRoute>
            <RouteBoundary>
              <CheckoutPage />
            </RouteBoundary>
          </ProtectedRoute>
        ),
      },
      {
        path: 'checkout/resultado',
        element: (
          <RouteBoundary>
            <CheckoutResultPage />
          </RouteBoundary>
        ),
      },
      { path: 'recetas', element: <RecipesPage /> },
      {
        path: 'recetas/:slug',
        element: (
          <RouteBoundary>
            <RecipeDetailPage />
          </RouteBoundary>
        ),
      },
      {
        path: 'cuenta',
        element: (
          <ProtectedRoute>
            <AccountLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <ProfilePage /> },
          { path: 'ordenes', element: <OrdersListPage /> },
          { path: 'ordenes/:orderNumber', element: <OrderDetailPage /> },
        ],
      },
      {
        path: 'login',
        element: (
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        ),
      },
      {
        path: 'registro',
        element: (
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        ),
      },
      { path: 'nosotros', element: <AboutPage /> },
      { path: 'contactenos', element: <ContactPage /> },
      { path: 'contacto', element: <Navigate to="/contactenos" replace /> },
      { path: 'dev/status', element: <SetupStatusPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
