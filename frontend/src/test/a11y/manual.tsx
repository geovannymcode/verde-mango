// Isolated audit entry; not imported by the production app. All API traffic is local fixtures.
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { httpClient } from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import { makeCart, makeCartItem, makeOrder, makeUser } from '../msw/factories'
import { apiResponse } from '../msw/responses'
import { auditData } from './data'
import '@/index.css'
const start = new URLSearchParams(location.search).get('route') ?? '/'
let cart = makeCart({ items: [makeCartItem()] })
httpClient.defaults.adapter = async (config) => {
  const path = new URL(config.url!, location.origin).pathname
  let data: unknown
  if (path === '/api/v1/orders/VM-AUDIT-PENDING') data = makeOrder({ status: 'PENDING' })
  else if (path === '/api/v1/cart') data = cart
  else if (path === '/api/v1/cart/items' && config.method === 'post') {
    cart = makeCart({ items: [makeCartItem()] })
    data = cart
  } else data = auditData(path)
  return { data: apiResponse(data), status: 200, statusText: 'OK', headers: {}, config }
}
useAuthStore.getState().setSession('audit-only', 'audit-only', makeUser({ role: 'SUPER_ADMIN' }))
history.replaceState(null, '', start)
const { router } = await import('@/routes')
createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <RouterProvider router={router} />
  </QueryClientProvider>,
)
