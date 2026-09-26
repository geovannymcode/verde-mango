import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
  mergeCart,
} from '@/api/orders'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { server } from '../msw/server'
import { makeCart, makeUser } from '../msw/factories'
import { apiResponse } from '../msw/responses'

describe('identidad de carrito en requests reales', () => {
  it('GET, POST, PUT y DELETE de invitado comparten X-Session-Id sin Authorization', async () => {
    useAuthStore.getState().setStatus('anonymous')
    useCartStore.getState().setGuestSessionId('guest-all-operations')
    const requests: Array<{
      method: string
      url: string
      body: string
      session: string | null
      authorization: string | null
    }> = []
    server.use(
      http.all('*/api/v1/cart*', async ({ request }) => {
        requests.push({
          method: request.method,
          url: request.url,
          body: await request.text(),
          session: request.headers.get('X-Session-Id'),
          authorization: request.headers.get('Authorization'),
        })
        return HttpResponse.json(apiResponse(makeCart()))
      }),
    )
    await getCart()
    await addCartItem({ productId: 1, quantity: 2 })
    await updateCartItem(1, { quantity: 3 })
    await removeCartItem(1)
    await clearCart()
    expect(requests).toEqual(
      [
        { method: 'GET', path: '', body: '' },
        { method: 'POST', path: '/items', body: JSON.stringify({ productId: 1, quantity: 2 }) },
        { method: 'PUT', path: '/items/1', body: JSON.stringify({ quantity: 3 }) },
        { method: 'DELETE', path: '/items/1', body: '' },
        { method: 'DELETE', path: '', body: '' },
      ].map(({ path, ...rest }) => ({
        ...rest,
        url: `http://localhost:3000/api/v1/cart${path}`,
        session: 'guest-all-operations',
        authorization: null,
      })),
    )
  })
  it('sin invitado previo no fabrica identificador al fusionar autenticado', async () => {
    useAuthStore.getState().setSession('test-access', 'test-refresh', makeUser())
    expect(useCartStore.getState().guestSessionId).toBeNull()
    const requests: Array<{
      method: string
      url: string
      body: string
      session: string | null
      authorization: string | null
    }> = []
    server.use(
      http.post('*/api/v1/cart/merge', async ({ request }) => {
        requests.push({
          method: request.method,
          url: request.url,
          body: await request.text(),
          session: request.headers.get('X-Session-Id'),
          authorization: request.headers.get('Authorization'),
        })
        return HttpResponse.json(apiResponse(makeCart()))
      }),
    )
    await mergeCart()
    expect(requests).toEqual([
      {
        method: 'POST',
        url: 'http://localhost:3000/api/v1/cart/merge',
        body: '',
        session: null,
        authorization: 'Bearer test-access',
      },
    ])
    expect(useCartStore.getState().guestSessionId).toBeNull()
  })
})
