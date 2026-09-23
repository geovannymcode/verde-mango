import type { QueryClient } from '@tanstack/react-query'
import { catalogKeys } from '@/features/catalog/keys'
import { adminCatalogKeys } from './catalogKeys'
const eventKey = 'vm:catalog-changed'
export async function invalidateCatalog(client: QueryClient) {
  await Promise.all([
    client.invalidateQueries({ queryKey: catalogKeys.all }),
    client.invalidateQueries({ queryKey: adminCatalogKeys.all }),
  ])
}
/** Send only an invalidation signal: no user, product or token data crosses tabs. */
export function publishCatalogChange() {
  try {
    localStorage.setItem(eventKey, crypto.randomUUID())
  } catch {
    /* Storage can be unavailable. */
  }
}
export function listenForCatalogChanges(client: QueryClient) {
  const listener = (event: StorageEvent) => {
    if (event.key === eventKey) void invalidateCatalog(client)
  }
  window.addEventListener('storage', listener)
  return () => window.removeEventListener('storage', listener)
}
