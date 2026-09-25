import type { QueryClient } from '@tanstack/react-query'
import { recipeKeys } from '@/features/recipes/keys'
import { adminKeys } from '../keys'
import { adminRecipeKeys } from './keys'
const key = 'vm:recipes-changed'
export async function invalidateRecipes(client: QueryClient) {
  await Promise.all([
    client.invalidateQueries({ queryKey: recipeKeys.all }),
    client.invalidateQueries({ queryKey: adminRecipeKeys.all }),
    client.invalidateQueries({ queryKey: adminKeys.all }),
  ])
}
export function publishRecipeChange() {
  try {
    localStorage.setItem(key, crypto.randomUUID())
  } catch {
    /* Storage can be restricted. */
  }
}
export function listenForRecipeChanges(client: QueryClient) {
  const listener = (event: StorageEvent) => {
    if (event.key === key) void invalidateRecipes(client)
  }
  window.addEventListener('storage', listener)
  return () => window.removeEventListener('storage', listener)
}
