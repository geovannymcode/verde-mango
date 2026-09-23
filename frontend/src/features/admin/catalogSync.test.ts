import { QueryClient } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { listenForCatalogChanges } from './catalogSync'
it('invalidates public and admin caches on another tab signal, and removes the listener', () => {
  const client = new QueryClient()
  const invalidate = vi.spyOn(client, 'invalidateQueries').mockResolvedValue()
  const dispose = listenForCatalogChanges(client)
  window.dispatchEvent(new StorageEvent('storage', { key: 'vm:catalog-changed', newValue: '1' }))
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['catalog'] })
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['admin', 'catalog'] })
  dispose(); invalidate.mockClear()
  window.dispatchEvent(new StorageEvent('storage', { key: 'vm:catalog-changed', newValue: '2' }))
  expect(invalidate).not.toHaveBeenCalled()
})
