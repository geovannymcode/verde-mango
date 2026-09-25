import type { QueryClient } from '@tanstack/react-query'
import { adminKeys } from '../keys'
import { orderKeys } from '@/features/cart/keys'
const key = 'vm:orders-changed'
export async function invalidateOrders(client: QueryClient) {
  await Promise.all([
    client.invalidateQueries({ queryKey: adminKeys.orders() }),
    client.invalidateQueries({ queryKey: orderKeys.all }),
  ])
}
export function publishOrderChange() {
  try {
    localStorage.setItem(key, crypto.randomUUID())
  } catch {
    /* Private browsing can restrict storage. */
  }
}
export function listenForOrderChanges(client: QueryClient) {
  const listener = (event: StorageEvent) => {
    if (event.key === key) void invalidateOrders(client)
  }
  window.addEventListener('storage', listener)
  return () => window.removeEventListener('storage', listener)
}
