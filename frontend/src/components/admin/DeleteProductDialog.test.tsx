import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DeleteProductDialog } from './DeleteProductDialog'
import type { ProductResponse } from '@/api/schema'
import * as api from '@/api/adminCatalog'
vi.mock('@/api/adminCatalog', () => ({ deleteAdminProduct: vi.fn(async () => undefined), updateAdminProduct: vi.fn() }))
afterEach(() => { cleanup(); vi.clearAllMocks() })
const product: ProductResponse = { id: 1, name: 'Mango', slug: 'mango', price: 4500, priceFormatted: '$4.500', discountPercentage: 0, discountAmount: 0, stock: 1, isInStock: true, isLowStock: true, trackInventory: true, allowBackorder: false, featured: false, active: true, ratingCount: 0, images: [], createdAt: '2026-09-22T12:00:00Z', updatedAt: '2026-09-22T12:00:00Z' }
it('requires the exact name before sending the real delete mutation', async () => {
  const close = vi.fn()
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}><DeleteProductDialog product={product} onClose={close} /></QueryClientProvider>)
  const confirm = screen.getByRole('button', { name: 'Eliminar producto' })
  expect(confirm).toBeDisabled()
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'mango' } })
  expect(confirm).toBeDisabled()
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Mango' } })
  fireEvent.click(confirm)
  await waitFor(() => expect(api.deleteAdminProduct).toHaveBeenCalledWith(1, expect.any(Object)))
  await waitFor(() => expect(close).toHaveBeenCalled())
})
