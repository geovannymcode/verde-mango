import { useState } from 'react'
import { screen } from '@testing-library/react'
import { useLocation } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { expect, it } from 'vitest'
import { renderWithProviders } from './utils'
import { server } from './msw/server'
import { makeUser, type Schema } from './msw/factories'
import { apiResponse, pageResponse, type ApiEnvelope } from './msw/responses'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { useUiStore } from '@/store/uiStore'

it.each([1, 2])('starts with clean state and fresh handlers (%s)', async () => {
  expect(useAuthStore.getState().status).toBe('loading')
  expect(useCartStore.getState().guestSessionId).toBeNull()
  expect(useUiStore.getState().toasts).toEqual([])
  expect(localStorage.length).toBe(0)
  const response = await fetch('http://localhost/api/v1/auth/me')
  const body: ApiEnvelope<Schema['UserResponse']> = await response.json()
  expect(body).toEqual(apiResponse(makeUser()))
  server.use(
    http.get('*/api/v1/auth/me', () => HttpResponse.json(apiResponse(makeUser({ id: 99 })))),
  )
  expect((await (await fetch('http://localhost/api/v1/auth/me')).json()).data.id).toBe(99)
  useAuthStore.getState().setSession('access', 'refresh', makeUser())
  useCartStore.getState().setGuestSessionId('guest')
  useUiStore.getState().pushToast({ message: 'Solo este test' })
})
function Probe() {
  const location = useLocation()
  const [count, setCount] = useState(0)
  return (
    <>
      <p>
        {location.pathname}
        {location.search}
      </p>
      <button onClick={() => setCount(count + 1)}>Contador {count}</button>
    </>
  )
}
it('provides an isolated QueryClient, configurable route and user-event', async () => {
  const { user, queryClient } = renderWithProviders(<Probe />, {
    initialEntries: ['/tienda?categoria=fermentos'],
  })
  expect(screen.getByText('/tienda?categoria=fermentos')).toBeInTheDocument()
  expect(queryClient.getDefaultOptions().queries).toMatchObject({ retry: false, gcTime: 0 })
  await user.click(screen.getByRole('button', { name: 'Contador 0' }))
  expect(screen.getByRole('button', { name: 'Contador 1' })).toBeInTheDocument()
})
it('builds pagination inside the real API envelope', async () => {
  const response = await fetch('http://localhost/api/v1/orders')
  expect(await response.json()).toEqual(apiResponse(pageResponse([], 0, 20)))
  expect(pageResponse([1, 2, 3], 1, 2)).toEqual({
    content: [3],
    page: 1,
    size: 2,
    totalElements: 3,
    totalPages: 2,
    first: false,
    last: true,
    hasNext: false,
    hasPrevious: true,
  })
})
