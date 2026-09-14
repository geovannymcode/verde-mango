import { createBrowserRouter } from 'react-router-dom'
import { RootLayout } from '@/components/layout/RootLayout'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { HomePage } from '@/pages/HomePage'
import { CatalogPage } from '@/pages/CatalogPage'
import { ProductDetailPage } from '@/pages/ProductDetailPage'
import { CartPage } from '@/pages/CartPage'
import { CheckoutPage } from '@/pages/CheckoutPage'
import { CheckoutResultPage } from '@/pages/CheckoutResultPage'
import { RecipesPage } from '@/pages/RecipesPage'
import { RecipeDetailPage } from '@/pages/RecipeDetailPage'
import { AccountPage } from '@/pages/AccountPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { AboutPage } from '@/pages/AboutPage'
import { ContactPage } from '@/pages/ContactPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { SetupStatusPage } from '@/pages/SetupStatusPage'

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
          <RequireAuth>
            <CheckoutPage />
          </RequireAuth>
        ),
      },
      { path: 'checkout/resultado', element: <CheckoutResultPage /> },
      { path: 'recetas', element: <RecipesPage /> },
      { path: 'recetas/:slug', element: <RecipeDetailPage /> },
      { path: 'cuenta', element: <AccountPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'registro', element: <RegisterPage /> },
      { path: 'nosotros', element: <AboutPage /> },
      { path: 'contacto', element: <ContactPage /> },
      { path: 'dev/status', element: <SetupStatusPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
