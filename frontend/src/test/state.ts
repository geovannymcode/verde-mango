import { QueryClient } from '@tanstack/react-query'
import { queryClient as appQueryClient } from '@/lib/queryClient'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { useUiStore } from '@/store/uiStore'
const clients = new Set<QueryClient>()
export function createTestQueryClient() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, refetchOnWindowFocus: false },
      mutations: { retry: false, gcTime: 0 },
    },
  })
  clients.add(client)
  return client
}
export async function clearTestQueryClients() {
  await Promise.all(
    [...clients, appQueryClient].map(async (client) => {
      await client.cancelQueries()
      client.clear()
    }),
  )
  clients.clear()
}
export function resetTestStores() {
  localStorage.clear()
  sessionStorage.clear()
  useAuthStore.setState(useAuthStore.getInitialState(), true)
  useCartStore.setState({ ...useCartStore.getInitialState(), guestSessionId: null }, true)
  useUiStore.setState(useUiStore.getInitialState(), true)
}
