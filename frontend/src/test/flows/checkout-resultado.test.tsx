import { act, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { expect, it, vi } from 'vitest'
import { CheckoutResultPage } from '@/pages/CheckoutResultPage'
import { useAuthStore } from '@/store/authStore'
import { server } from '../msw/server'
import { makeOrder, makeUser, type Schema } from '../msw/factories'
import { apiResponse } from '../msw/responses'
import { renderWithProviders } from '../utils'

type RequestRecord = { method: string; url: string; body: string; authorization: string | null }
function setup(statuses: Schema['OrderResponse']['status'][], urlStatus = 'PENDING') {
  // Fake only the polling clock. RTL's condition-based waits and React notifications remain real.
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
  useAuthStore.getState().setSession('test-access', 'test-refresh', makeUser())
  const requests: RequestRecord[] = []
  server.use(
    http.get('*/api/v1/orders/:orderNumber', async ({ request }) => {
      const status = statuses[Math.min(requests.length, statuses.length - 1)]!
      requests.push({
        method: request.method,
        url: request.url,
        body: await request.text(),
        authorization: request.headers.get('authorization'),
      })
      return HttpResponse.json(
        apiResponse(
          makeOrder({ status, statusLabel: status === 'CANCELLED' ? 'Cancelada' : status }),
        ),
      )
    }),
  )
  const view = renderWithProviders(<CheckoutResultPage />, {
    initialEntries: [`/checkout/resultado?id=wompi-test&reference=VM-TEST-001&status=${urlStatus}`],
    userOptions: { advanceTimers: vi.advanceTimersByTime },
  })
  async function tick(expectedCount: number) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })
    await waitFor(() => {
      expect(requests).toHaveLength(expectedCount)
      expect(view.queryClient.isFetching()).toBe(0)
    })
  }
  function assertRequests() {
    for (const request of requests) {
      expect(request).toEqual({
        method: 'GET',
        url: 'http://localhost:3000/api/v1/orders/VM-TEST-001',
        body: '',
        authorization: 'Bearer test-access',
      })
    }
  }
  return { ...view, requests, tick, assertRequests }
}
it('consulta pendiente hasta confirmado, muestra aprobado y detiene el polling', async () => {
  const s = setup(['PENDING', 'PENDING', 'CONFIRMED'])
  await screen.findByRole('heading', { name: 'Estamos confirmando tu pago' })
  await s.tick(2)
  expect(screen.getByRole('heading', { name: 'Estamos confirmando tu pago' })).toBeInTheDocument()
  await s.tick(3)
  await screen.findByRole('heading', { name: '¡Gracias por tu compra!' })
  await act(async () => {
    await vi.advanceTimersByTimeAsync(30_000)
  })
  expect(s.requests).toHaveLength(3)
  s.assertRequests()
})
it('el rechazo del backend prevalece sobre status=APPROVED en la URL', async () => {
  const s = setup(['CANCELLED'], 'APPROVED')
  await screen.findByRole('heading', { name: 'No pudimos procesar tu pago' })
  expect(screen.queryByRole('heading', { name: '¡Gracias por tu compra!' })).not.toBeInTheDocument()
  await act(async () => {
    await vi.advanceTimersByTimeAsync(30_000)
  })
  expect(s.requests).toHaveLength(1)
  s.assertRequests()
})
it('corta tras 10 consultas pendientes y no vuelve a consultar automáticamente', async () => {
  const s = setup(['PENDING'])
  await screen.findByRole('heading', { name: 'Estamos confirmando tu pago' })
  for (let count = 2; count <= 10; count++) await s.tick(count)
  await screen.findByRole('button', { name: 'Verificar de nuevo' })
  expect(screen.getByText('Estamos confirmando tu pago con la pasarela')).toBeInTheDocument()
  s.rerender(<CheckoutResultPage />)
  await act(async () => {
    await vi.advanceTimersByTimeAsync(60_000)
  })
  expect(s.requests).toHaveLength(10)
  s.assertRequests()
})
it('Verificar de nuevo inicia un ciclo nuevo de diez intentos', async () => {
  const s = setup(['PENDING'])
  await screen.findByRole('heading', { name: 'Estamos confirmando tu pago' })
  for (let count = 2; count <= 10; count++) await s.tick(count)
  await s.user.click(await screen.findByRole('button', { name: 'Verificar de nuevo' }))
  await waitFor(() => expect(s.requests).toHaveLength(11))
  await screen.findByRole('heading', { name: 'Estamos confirmando tu pago' })
  for (let count = 12; count <= 20; count++) await s.tick(count)
  await screen.findByRole('button', { name: 'Verificar de nuevo' })
  await act(async () => {
    await vi.advanceTimersByTimeAsync(30_000)
  })
  expect(s.requests).toHaveLength(20)
  s.assertRequests()
})
it('detiene un rechazo final antes del intento diez', async () => {
  const s = setup(['PENDING', 'CANCELLED'])
  await screen.findByRole('heading', { name: 'Estamos confirmando tu pago' })
  await s.tick(2)
  await screen.findByRole('heading', { name: 'No pudimos procesar tu pago' })
  await act(async () => {
    await vi.advanceTimersByTimeAsync(30_000)
  })
  expect(s.requests).toHaveLength(2)
  expect(screen.queryByRole('button', { name: 'Verificar de nuevo' })).not.toBeInTheDocument()
  s.assertRequests()
})
it('pausa en background, conserva intentos al volver y cancela polling al desmontar', async () => {
  let visibility: DocumentVisibilityState = 'visible'
  vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility)
  const s = setup(['PENDING'])
  await screen.findByRole('heading', { name: 'Estamos confirmando tu pago' })
  await act(async () => {
    visibility = 'hidden'
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await act(async () => {
    await vi.advanceTimersByTimeAsync(30_000)
  })
  expect(s.requests).toHaveLength(1)
  await act(async () => {
    visibility = 'visible'
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await s.tick(2)
  s.unmount()
  await act(async () => {
    await vi.advanceTimersByTimeAsync(30_000)
  })
  expect(s.requests).toHaveLength(2)
  s.assertRequests()
})
