import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RootLayout } from '@/components/layout/RootLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AdminRoute } from '@/components/auth/AdminRoute'
import { GuestRoute } from '@/components/auth/GuestRoute'
import { HomePage } from '@/pages/HomePage'
import { CatalogPage } from '@/pages/CatalogPage'
import { ProductDetailPage } from '@/pages/ProductDetailPage'
import { CartPage } from '@/pages/CartPage'
import { CheckoutPage } from '@/pages/CheckoutPage'
import { CheckoutResultPage } from '@/pages/CheckoutResultPage'
import { RecipesPage } from '@/pages/RecipesPage'
import { RecipeDetailPage } from '@/pages/RecipeDetailPage'
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
import { AdminPlaceholderPage } from '@/pages/admin/AdminPlaceholderPage'

export const router = createBrowserRouter([
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
            <CheckoutPage />
          </ProtectedRoute>
        ),
      },
      { path: 'checkout/resultado', element: <CheckoutResultPage /> },
      { path: 'recetas', element: <RecipesPage /> },
      { path: 'recetas/:slug', element: <RecipeDetailPage /> },
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
        path: 'admin',
        element: (
          <AdminRoute>
            <AdminPlaceholderPage />
          </AdminRoute>
        ),
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
