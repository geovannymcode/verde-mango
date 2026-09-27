import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { expect, it, vi } from 'vitest'
import { DeleteProductDialog } from '@/components/admin/DeleteProductDialog'
import { useAuthStore } from '@/store/authStore'
import { renderWithProviders } from '../utils'
import { server } from '../msw/server'
import { makeProduct, makeUser } from '../msw/factories'

it('permite escribir el nombre completo sin remontar ni perder foco y envía DELETE solo al confirmar', async () => {
  useAuthStore.getState().setSession('test-admin', 'test-refresh', makeUser({ role: 'ADMIN' }))
  const product = makeProduct({ name: 'Kimchi artesanal de repollo y especias naturales' })
  const requests: Array<{
    method: string
    url: string
    body: string
    authorization: string | null
  }> = []
  server.use(
    http.delete('*/api/v1/admin/products/1', async ({ request }) => {
      requests.push({
        method: request.method,
        url: request.url,
        body: await request.text(),
        authorization: request.headers.get('Authorization'),
      })
      return new HttpResponse(null, { status: 204 })
    }),
  )
  const close = vi.fn()
  const { user } = renderWithProviders(<DeleteProductDialog product={product} onClose={close} />)
  const dialog = screen.getByRole('dialog', { name: 'Eliminar producto' })
  const input = within(dialog).getByRole('textbox', {
    name: `Escribe «${product.name}» para confirmar`,
  })
  const button = within(dialog).getByRole('button', { name: 'Eliminar producto' })
  await user.click(input)
  for (const [index, character] of Array.from(product.name).entries()) {
    expect(button).toBeDisabled()
    await user.keyboard(character)
    expect(within(dialog).getByRole('textbox')).toBe(input)
    expect(input).toHaveFocus()
    expect(input).toHaveValue(product.name.slice(0, index + 1))
  }
  expect(button).toBeEnabled()
  expect(requests).toEqual([])
  await user.click(button)
  await waitFor(() => expect(close).toHaveBeenCalledOnce())
  expect(requests).toEqual([
    {
      method: 'DELETE',
      url: 'http://localhost:3000/api/v1/admin/products/1',
      body: '',
      authorization: 'Bearer test-admin',
    },
  ])
})
