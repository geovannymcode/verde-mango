import { listenForOrderChanges } from '@/features/admin/orders/sync'
import { listenForRecipeChanges } from '@/features/admin/recipes/sync'
import { useEffect } from 'react'
import { listenForCatalogChanges } from '@/features/admin/catalogSync'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { queryClient } from '@/lib/queryClient'
import { router } from '@/routes'
import { useAuthBootstrap } from '@/features/auth/hooks'
import { useAuthStore } from '@/store/authStore'
import { SplashScreen } from '@/components/layout/SplashScreen'

function App() {
  useAuthBootstrap()
  useEffect(() => listenForRecipeChanges(queryClient), [])
  useEffect(() => listenForOrderChanges(queryClient), [])
  useEffect(() => listenForCatalogChanges(queryClient), [])
  const status = useAuthStore((state) => state.status)

  return (
    <QueryClientProvider client={queryClient}>
      {status === 'loading' ? <SplashScreen /> : <RouterProvider router={router} />}
    </QueryClientProvider>
  )
}

export default App
