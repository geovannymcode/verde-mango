import { screen, waitFor, within } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { AdminOrderDetailPage } from '@/pages/admin/AdminOrderDetailPage'
import { AdminRoute } from '@/components/auth/AdminRoute'
import { ToastContainer } from '@/components/ui/Toast'
import { useAuthStore } from '@/store/authStore'
import { adminKeys } from '@/features/admin/keys'
import { orderKeys } from '@/features/cart/keys'
import {
  orderStatuses,
  orderTransitions,
  orderStatusLabels,
} from '@/features/admin/orders/transitions'
import type { OrderStatus } from '@/api/schema'
import { renderWithProviders } from '../utils'
import { server } from '../msw/server'
import { makeOrder, makeUser, fixtureDate } from '../msw/factories'
import { apiResponse } from '../msw/responses'

const conflictMessage = 'La orden cambió en otra sesión. Recarga y revisa su estado.'
function setup(status: OrderStatus = 'PENDING', reject = false) {
  useAuthStore.getState().setSession('test-admin', 'test-refresh', makeUser({ role: 'ADMIN' }))
  let order = makeOrder({ status, statusLabel: orderStatusLabels[status] })
  const requests: Array<{
    method: string
    url: string
    body: string
    authorization: string | null
  }> = []
  server.use(
    http.get('*/api/v1/admin/orders/1', async ({ request }) => {
      requests.push({
        method: request.method,
        url: request.url,
        body: await request.text(),
        authorization: request.headers.get('Authorization'),
      })
      return HttpResponse.json(apiResponse(order))
    }),
    http.patch('*/api/v1/admin/orders/1/status', async ({ request }) => {
      requests.push({
        method: request.method,
        url: request.url,
        body: await request.text(),
        authorization: request.headers.get('Authorization'),
      })
      // Server truth changes before refetch; do not satisfy the UI with only a mutation response.
      order = makeOrder({
        status: reject ? 'CANCELLED' : 'CONFIRMED',
        statusLabel: reject ? 'Cancelada' : 'Confirmada',
      })
      if (reject)
        return HttpResponse.json(
          { success: false, message: conflictMessage, timestamp: fixtureDate },
          { status: 409 },
        )
      return HttpResponse.json(apiResponse(order))
    }),
  )
  const context = renderWithProviders(
    <>
      <Routes>
        <Route
          path="/admin/ordenes/:id"
          element={
            <AdminRoute>
              <AdminOrderDetailPage />
            </AdminRoute>
          }
        />
      </Routes>
      <ToastContainer />
    </>,
    { initialEntries: ['/admin/ordenes/1'] },
  )
  const invalidate = vi.spyOn(context.queryClient, 'invalidateQueries')
  return { ...context, requests, invalidate }
}
function getRequest() {
  return {
    method: 'GET',
    url: 'http://localhost:3000/api/v1/admin/orders/1',
    body: '',
    authorization: 'Bearer test-admin',
  }
}
async function confirm(context: ReturnType<typeof setup>, note = 'Revisada por administración') {
  await screen.findByRole('heading', { name: 'Orden VM-TEST-001' })
  expect(context.requests).toEqual([getRequest()])
  const select = screen.getByRole('combobox', { name: 'Cambiar estado' })
  expect(
    within(select)
      .getAllByRole('option')
      .map((option) => option.getAttribute('value')),
  ).toEqual(['', ...orderTransitions.PENDING])
  await context.user.selectOptions(select, 'CONFIRMED')
  await context.user.click(screen.getByRole('button', { name: 'Revisar cambio' }))
  const dialog = screen.getByRole('dialog', { name: 'Confirmar cambio de estado' })
  const input = within(dialog).getByLabelText('Nota (opcional)')
  await context.user.click(input)
  for (const character of note) {
    await context.user.keyboard(character)
    expect(within(dialog).getByLabelText('Nota (opcional)')).toBe(input)
    expect(input).toHaveFocus()
  }
  expect(input).toHaveValue(note)
  expect(context.requests).toEqual([getRequest()])
  await context.user.click(within(dialog).getByRole('button', { name: 'Aplicar cambio' }))
  return dialog
}
function assertMutationAndRefetch(
  context: ReturnType<typeof setup>,
  note = 'Revisada por administración',
) {
  expect(context.requests).toEqual([
    getRequest(),
    {
      method: 'PATCH',
      url: 'http://localhost:3000/api/v1/admin/orders/1/status',
      body: JSON.stringify({ status: 'CONFIRMED', comment: note }),
      authorization: 'Bearer test-admin',
    },
    getRequest(),
  ])
}
describe('administración: cambio de estado', () => {
  it.each(orderStatuses)('desde %s ofrece exactamente los destinos del mapa', async (status) => {
    const context = setup(status)
    await screen.findByRole('heading', { name: 'Orden VM-TEST-001' })
    expect(context.requests).toEqual([getRequest()])
    const destinations = orderTransitions[status]
    if (!destinations.length) {
      expect(screen.queryByRole('combobox', { name: 'Cambiar estado' })).not.toBeInTheDocument()
      expect(screen.getByText('Estado final: no hay transiciones disponibles.')).toBeVisible()
    } else {
      const select = screen.getByRole('combobox', { name: 'Cambiar estado' })
      await context.user.click(select)
      expect(
        within(select)
          .getAllByRole('option')
          .map((option) => ({ value: option.getAttribute('value'), label: option.textContent })),
      ).toEqual([
        { value: '', label: 'Selecciona un destino' },
        ...destinations.map((value) => ({ value, label: orderStatusLabels[value] })),
      ])
    }
  })
  // BUG-9B-05: regresión del foco y de la identidad del input.
  // No sustituir user.type por change ni reducir la nota esperada para ocultarlo.
  it('confirma transición, invalida admin/cuenta y refresca detalle desde servidor', async () => {
    const context = setup()
    await confirm(context)
    await waitFor(() => expect(context.queryClient.isMutating()).toBe(0))
    expect(await screen.findByRole('status')).toHaveTextContent('Estado de la orden actualizado.')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    assertMutationAndRefetch(context)
    expect(context.invalidate).toHaveBeenCalledWith({ queryKey: adminKeys.orders() })
    expect(context.invalidate).toHaveBeenCalledWith({ queryKey: orderKeys.all })
    expect(context.queryClient.getQueryData(adminKeys.orderDetail(1))).toMatchObject({
      status: 'CONFIRMED',
    })
    const select = screen.getByRole('combobox', { name: 'Cambiar estado' })
    expect(
      within(select)
        .getAllByRole('option')
        .map((option) => option.getAttribute('value')),
    ).toEqual(['', ...orderTransitions.CONFIRMED])
  })
  // Regresión también ante rechazo del servidor.
  it('ante 409 muestra el mensaje exacto y refresca el estado que rechazó la transición', async () => {
    const context = setup('PENDING', true)
    const dialog = await confirm(context)
    expect(await within(dialog).findByText(conflictMessage)).toBeVisible()
    expect(
      within(dialog)
        .getAllByRole('alert')
        .map((alert) => alert.textContent),
    ).toContain(conflictMessage)
    await waitFor(() => expect(context.queryClient.isMutating()).toBe(0))
    assertMutationAndRefetch(context)
    expect(context.invalidate).toHaveBeenCalledWith({ queryKey: adminKeys.orderDetail(1) })
    expect(context.queryClient.getQueryData(adminKeys.orderDetail(1))).toMatchObject({
      status: 'CANCELLED',
    })
    expect(within(dialog).getByRole('button', { name: 'Aplicar cambio' })).toBeDisabled()
    await context.user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
    expect(screen.getByText('Estado final: no hay transiciones disponibles.')).toBeVisible()
    expect(screen.queryByRole('combobox', { name: 'Cambiar estado' })).not.toBeInTheDocument()
  })
  it('envía íntegra una nota larga escrita carácter por carácter sin remontar el input', async () => {
    const context = setup()
    const note =
      'Orden revisada con el cliente. Confirmamos cantidades, dirección de entrega y disponibilidad de todos los productos antes de preparar el envío.'
    await confirm(context, note)
    await waitFor(() => expect(context.queryClient.isMutating()).toBe(0))
    assertMutationAndRefetch(context, note)
  })
})
