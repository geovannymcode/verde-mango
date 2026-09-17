import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { queryClient } from '@/lib/queryClient'
import { router } from '@/routes'
import { useAuthBootstrap } from '@/features/auth/hooks'
import { useAuthStore } from '@/store/authStore'
import { SplashScreen } from '@/components/layout/SplashScreen'

function App() {
  useAuthBootstrap()
  const status = useAuthStore((state) => state.status)

  return (
    <QueryClientProvider client={queryClient}>
      {status === 'loading' ? <SplashScreen /> : <RouterProvider router={router} />}
    </QueryClientProvider>
  )
}

export default App
