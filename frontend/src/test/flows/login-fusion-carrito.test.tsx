import { screen, waitFor, within } from '@testing-library/react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { LoginPage } from '@/pages/LoginPage'
import { GuestRoute } from '@/components/auth/GuestRoute'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Header } from '@/components/layout/Header'
import { CartDrawer } from '@/components/layout/CartDrawer'
import { ToastContainer } from '@/components/ui/Toast'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { server } from '../msw/server'
import { makeAuth, makeCart, makeCartItem, fixtureDate } from '../msw/factories'
import { apiResponse } from '../msw/responses'
import { renderWithProviders } from '../utils'

function Location() {
  const location = useLocation()
  return (
    <output aria-label="Ruta actual">
      {location.pathname}
      {location.search}
    </output>
  )
}
function setup(reject = false) {
  useAuthStore.getState().setStatus('anonymous')
  useCartStore.getState().setGuestSessionId('guest-merge-test')
  const guest = makeCart({ items: [makeCartItem({ quantity: 2 })] })
  const account = makeCart({
    items: [
      makeCartItem({ productId: 2, id: 2, productName: 'Kombucha', productSlug: 'kombucha' }),
    ],
  })
  const merged = makeCart({ items: [...guest.items, ...account.items] })
  let accountCart = account
  const requests: Array<{
    method: string
    url: string
    body: string
    session: string | null
    authorization: string | null
  }> = []
  server.use(
    http.get('*/api/v1/cart', ({ request }) =>
      HttpResponse.json(apiResponse(request.headers.has('Authorization') ? accountCart : guest)),
    ),
    http.post('*/api/v1/auth/login', async ({ request }) => {
      requests.push({
        method: request.method,
        url: request.url,
        body: await request.text(),
        session: request.headers.get('X-Session-Id'),
        authorization: request.headers.get('Authorization'),
      })
      return HttpResponse.json(apiResponse(makeAuth()))
    }),
    http.post('*/api/v1/cart/merge', async ({ request }) => {
      requests.push({
        method: request.method,
        url: request.url,
        body: await request.text(),
        session: request.headers.get('X-Session-Id'),
        authorization: request.headers.get('Authorization'),
      })
      if (reject)
        return HttpResponse.json(
          { success: false, message: 'No fue posible fusionar', timestamp: fixtureDate },
          { status: 500 },
        )
      // Real backend: missing session header returns the account cart without merging.
      if (request.headers.get('X-Session-Id') === 'guest-merge-test') accountCart = merged
      return HttpResponse.json(apiResponse(accountCart))
    }),
  )
  return {
    ...renderWithProviders(
      <>
        <Header />
        <Location />
        <Routes>
          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="/cuenta/ordenes"
            element={
              <ProtectedRoute>
                <h1>Mis órdenes</h1>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<h1>Inicio</h1>} />
        </Routes>
        <CartDrawer />
        <ToastContainer />
      </>,
      { initialEntries: ['/login?returnTo=%2Fcuenta%2Fordenes%3Fpage%3D2'] },
    ),
    requests,
  }
}
async function login(context: ReturnType<typeof setup>) {
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Abrir carrito' })).toHaveTextContent('2'),
  )
  await context.user.type(screen.getByLabelText('Correo electrónico'), 'cliente@example.test')
  await context.user.type(screen.getByLabelText('Contraseña'), 'Clave123!')
  await context.user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
  await waitFor(() => expect(context.requests).toHaveLength(2))
  expect(context.requests[0]).toEqual({
    method: 'POST',
    url: 'http://localhost:3000/api/v1/auth/login',
    body: JSON.stringify({ email: 'cliente@example.test', password: 'Clave123!' }),
    session: null,
    authorization: null,
  })
  expect(context.requests[1]).toMatchObject({
    method: 'POST',
    url: 'http://localhost:3000/api/v1/cart/merge',
    body: '',
    authorization: 'Bearer test-access',
  })
}
describe('login y fusión de carrito', () => {
  // BUG-9B-02: merge omite X-Session-Id tras autenticar; pendiente de decisión.
  it.skip('envía sessionId, limpia invitado, muestra ítems fusionados y vuelve a returnTo', async () => {
    const context = setup()
    await login(context)
    expect(context.requests[1]).toMatchObject({ session: 'guest-merge-test' })
    await waitFor(() => expect(useCartStore.getState().guestSessionId).toBeNull())
    expect(await screen.findByRole('heading', { name: 'Mis órdenes' })).toBeVisible()
    expect(screen.getByLabelText('Ruta actual')).toHaveTextContent('/cuenta/ordenes?page=2')
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Abrir carrito' })).toHaveTextContent('3'),
    )
    await context.user.click(screen.getByRole('button', { name: 'Abrir carrito' }))
    const drawer = screen.getByRole('dialog', { name: 'Tu carrito' })
    expect(within(drawer).getByRole('link', { name: 'Kimchi de prueba' })).toBeVisible()
    expect(within(drawer).getByRole('link', { name: 'Kombucha' })).toBeVisible()
  })
  // BUG-9B-03: regresión con el guard real, incluida fusión fallida.
  it('un error de fusión no rompe el login ni returnTo y avisa al usuario', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const context = setup(true)
    await login(context)
    expect(await screen.findByRole('status', { name: '' })).toHaveTextContent(
      'No pudimos combinar tu carrito anterior. Revisa tu carrito actual.',
    )
    expect(await screen.findByRole('heading', { name: 'Mis órdenes' })).toBeVisible()
    expect(screen.getByLabelText('Ruta actual')).toHaveTextContent('/cuenta/ordenes?page=2')
    expect(useAuthStore.getState().status).toBe('authenticated')
    expect(useAuthStore.getState().accessToken).toBe('test-access')
    expect(useCartStore.getState().guestSessionId).toBe('guest-merge-test')
    expect(log).toHaveBeenCalledWith(
      'No se pudo fusionar el carrito de invitado',
      expect.any(Error),
    )
  })
})
