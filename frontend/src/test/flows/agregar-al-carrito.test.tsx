import { screen, waitFor, within } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { ProductDetailPage } from '@/pages/ProductDetailPage'
import { Header } from '@/components/layout/Header'
import { CartDrawer } from '@/components/layout/CartDrawer'
import { ToastContainer } from '@/components/ui/Toast'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { cartKeys } from '@/features/cart/keys'
import { server } from '../msw/server'
import { makeCart, makeCartItem, fixtureDate } from '../msw/factories'
import { apiResponse } from '../msw/responses'
import { renderWithProviders } from '../utils'

function setup(reject = false) {
  useAuthStore.getState().setStatus('anonymous')
  useCartStore.getState().setGuestSessionId('guest-cart-test')
  let cart = makeCart()
  const requests: Array<{ method: string; url: string; body: string; session: string | null }> = []
  let release!: () => void
  const pending = new Promise<void>((resolve) => {
    release = resolve
  })
  let releaseRefetch!: () => void
  const refetchPending = new Promise<void>((resolve) => {
    releaseRefetch = resolve
  })
  let reads = 0
  server.use(
    http.get('*/api/v1/cart', async () => {
      reads += 1
      // Hold the invalidated GET so it cannot hide a broken optimistic rollback.
      if (reject && reads > 1) await refetchPending
      return HttpResponse.json(apiResponse(cart))
    }),
    http.post('*/api/v1/cart/items', async ({ request }) => {
      requests.push({
        method: request.method,
        url: request.url,
        body: await request.text(),
        session: request.headers.get('X-Session-Id'),
      })
      await pending
      if (reject)
        return HttpResponse.json(
          { success: false, message: 'Stock insuficiente', timestamp: fixtureDate },
          { status: 409 },
        )
      cart = makeCart({ items: [makeCartItem({ quantity: 2 })] })
      return HttpResponse.json(apiResponse(cart))
    }),
  )
  return {
    ...renderWithProviders(
      <>
        <Header />
        <Routes>
          <Route path="/tienda/:slug" element={<ProductDetailPage />} />
        </Routes>
        <CartDrawer />
        <ToastContainer />
      </>,
      { initialEntries: ['/tienda/kimchi-prueba'] },
    ),
    requests,
    release,
    releaseRefetch,
  }
}

async function add(context: ReturnType<typeof setup>) {
  await screen.findByRole('heading', { name: 'Kimchi de prueba', level: 1 })
  await waitFor(() =>
    expect(context.queryClient.getQueryData(cartKeys.detail())).toEqual(makeCart()),
  )
  await context.user.click(screen.getByRole('button', { name: 'Aumentar cantidad' }))
  await context.user.click(screen.getByRole('button', { name: 'Agregar al carrito' }))
  const drawer = await screen.findByRole('dialog', { name: 'Tu carrito' })
  expect(within(drawer).getByRole('link', { name: 'Kimchi de prueba' })).toBeVisible()
  expect(within(drawer).getByText('2', { exact: true })).toBeVisible()
  expect(screen.getByRole('button', { name: 'Abrir carrito' })).toHaveTextContent('2')
  await waitFor(() =>
    expect(context.requests).toEqual([
      {
        method: 'POST',
        url: 'http://localhost:3000/api/v1/cart/items',
        body: JSON.stringify({ productId: 1, quantity: 2 }),
        session: 'guest-cart-test',
      },
    ]),
  )
  return drawer
}

describe('detalle → carrito', () => {
  it('elige cantidad, abre el drawer y mantiene ítem y contador tras confirmar la API', async () => {
    const context = setup()
    const drawer = await add(context)
    context.release()
    await waitFor(() => expect(context.queryClient.isMutating()).toBe(0))
    await waitFor(() => expect(context.queryClient.isFetching()).toBe(0))
    expect(within(drawer).getByRole('link', { name: 'Kimchi de prueba' })).toBeVisible()
    expect(within(drawer).getByText('2', { exact: true })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Abrir carrito' })).toHaveTextContent('2')
    expect(context.queryClient.getQueryData(cartKeys.detail())).toEqual(
      makeCart({ items: [makeCartItem({ quantity: 2 })] }),
    )
  })
  it('revierte ítem optimista y contador si el servidor rechaza agregar', async () => {
    const context = setup(true)
    const drawer = await add(context)
    context.release()
    expect(await within(drawer).findByText('Tu carrito está vacío.')).toBeVisible()
    expect(await screen.findByRole('status')).toHaveTextContent(
      'No pudimos agregar el producto al carrito.',
    )
    expect(context.queryClient.getQueryData(cartKeys.detail())).toEqual(makeCart())
    context.releaseRefetch()
    await waitFor(() => expect(context.queryClient.isFetching()).toBe(0))
    expect(screen.getByRole('button', { name: 'Abrir carrito' })).not.toHaveTextContent('2')
    expect(context.queryClient.getQueryData(cartKeys.detail())).toEqual(makeCart())
    expect(context.requests).toHaveLength(1)
  })
})
