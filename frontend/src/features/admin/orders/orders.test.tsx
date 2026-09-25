import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { OrderResponse, OrderStatus } from '@/api/schema'
import { ApiError } from '@/api/types'
import * as api from '@/api/admin'
import { orderTransitions, canTransition, orderStatuses } from './transitions'
import { OrderTimeline } from './OrderTimeline'
import { OrderStatusControl } from './OrderStatusControl'
import { ordersParams } from './filters'
vi.mock('@/api/admin', () => ({ updateAdminOrderStatus: vi.fn() }))
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})
it('offers exactly the transitions in the Kotlin state machine, including DELIVERED → REFUNDED', () => {
  const expected: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['SHIPPED', 'CANCELLED'],
    SHIPPED: ['DELIVERED', 'CANCELLED'],
    DELIVERED: ['REFUNDED'],
    CANCELLED: [],
    REFUNDED: [],
  }
  for (const from of orderStatuses) {
    expect(orderTransitions[from]).toEqual(expected[from])
    for (const to of orderStatuses)
      expect(canTransition(from, to)).toBe(expected[from].includes(to))
  }
})
it('renders dated notes and actor identifiers and highlights only the current timeline entry', () => {
  const history: OrderResponse['statusHistory'] = [
    {
      id: 2,
      fromStatus: 'PENDING',
      toStatus: 'CONFIRMED',
      createdAt: '2026-09-23T15:00:00Z',
      changedByType: 'ADMIN',
      changedByUserId: 7,
      comment: 'Verificado',
    },
    { id: 1, toStatus: 'PENDING', createdAt: '2026-09-22T15:00:00Z', changedByType: 'SYSTEM' },
  ]
  render(<OrderTimeline history={history} current="CONFIRMED" />)
  expect(screen.getByText('Verificado')).toBeInTheDocument()
  expect(screen.getByText(/Usuario #7/)).toBeInTheDocument()
  expect(screen.getAllByRole('listitem')[1]).toHaveAttribute('aria-current', 'step')
  expect(screen.getByText(/23 de septiembre de 2026/)).toBeInTheDocument()
})
function setup(status: OrderStatus = 'PROCESSING') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const invalidate = vi.spyOn(client, 'invalidateQueries')
  render(
    <QueryClientProvider client={client}>
      <OrderStatusControl id={42} number="VM-42" status={status} />
    </QueryClientProvider>,
  )
  return { client, invalidate }
}
it('waits for explicit confirmation, sends the note and invalidates admin/public orders', async () => {
  vi.mocked(api.updateAdminOrderStatus).mockResolvedValue({} as OrderResponse)
  const { invalidate } = setup()
  expect(screen.queryByRole('option', { name: 'Entregada' })).not.toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Cambiar estado'), { target: { value: 'SHIPPED' } })
  fireEvent.click(screen.getByRole('button', { name: 'Revisar cambio' }))
  expect(api.updateAdminOrderStatus).not.toHaveBeenCalled()
  expect(screen.getByText(/PROCESSING.*SHIPPED/)).toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Nota (opcional)'), { target: { value: 'Sale mañana' } })
  fireEvent.click(screen.getByRole('button', { name: 'Aplicar cambio' }))
  await waitFor(() =>
    expect(api.updateAdminOrderStatus).toHaveBeenCalledWith(
      42,
      expect.objectContaining({ status: 'SHIPPED', comment: 'Sale mañana' }),
    ),
  )
  await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ['orders'] }))
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['admin', 'orders'] })
})
it.each([400, 409])(
  'shows the exact server rejection (%s) and refreshes the detail',
  async (status) => {
    vi.mocked(api.updateAdminOrderStatus).mockRejectedValue(
      new ApiError('La orden cambió en otra sesión.', { status }),
    )
    const { invalidate } = setup()
    fireEvent.change(screen.getByLabelText('Cambiar estado'), { target: { value: 'SHIPPED' } })
    fireEvent.click(screen.getByRole('button', { name: 'Revisar cambio' }))
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar cambio' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('La orden cambió en otra sesión.')
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['admin', 'orders', 'detail', 42] })
  },
)
it.each(['CANCELLED', 'REFUNDED'] as const)('hides the state control for terminal %s', (status) => {
  setup(status)
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  expect(screen.getByText(/Estado final/)).toBeInTheDocument()
})
it('maps URL multi-status and Colombia date boundaries to server filters', () => {
  expect(
    ordersParams(
      new URLSearchParams(
        'estados=CONFIRMED,PROCESSING,invalid&desde=2026-09-23&hasta=2026-09-23&orden=totalAmount&direccion=asc&pago=APPROVED',
      ),
      2,
    ),
  ).toMatchObject({
    statuses: ['CONFIRMED', 'PROCESSING'],
    fromDate: '2026-09-23T00:00:00-05:00',
    toDate: '2026-09-23T23:59:59.999-05:00',
    page: 1,
    sortBy: 'totalAmount',
    sortDir: 'asc',
    paymentStatus: 'APPROVED',
  })
})

it('disables the control until the server responds and never updates cached state optimistically', async () => {
  let resolve!: (value: OrderResponse) => void
  vi.mocked(api.updateAdminOrderStatus).mockReturnValue(
    new Promise<OrderResponse>((done) => {
      resolve = done
    }),
  )
  const { client } = setup()
  client.setQueryData(['admin', 'orders', 'detail', 42], { status: 'PROCESSING' })
  fireEvent.change(screen.getByLabelText('Cambiar estado'), { target: { value: 'SHIPPED' } })
  fireEvent.click(screen.getByRole('button', { name: 'Revisar cambio' }))
  fireEvent.click(screen.getByRole('button', { name: 'Aplicar cambio' }))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Procesando…' })).toBeDisabled())
  expect(screen.getByLabelText('Cambiar estado')).toBeDisabled()
  expect(client.getQueryData(['admin', 'orders', 'detail', 42])).toEqual({ status: 'PROCESSING' })
  resolve({} as OrderResponse)
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
})

it('allows closing a confirmation when a refetch makes the selected transition invalid', async () => {
  const client = new QueryClient()
  const view = render(
    <QueryClientProvider client={client}>
      <OrderStatusControl id={42} number="VM-42" status="PROCESSING" />
    </QueryClientProvider>,
  )
  fireEvent.change(screen.getByLabelText('Cambiar estado'), { target: { value: 'SHIPPED' } })
  fireEvent.click(screen.getByRole('button', { name: 'Revisar cambio' }))
  view.rerender(
    <QueryClientProvider client={client}>
      <OrderStatusControl id={42} number="VM-42" status="CANCELLED" />
    </QueryClientProvider>,
  )
  expect(screen.getByRole('button', { name: 'Aplicar cambio' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(api.updateAdminOrderStatus).not.toHaveBeenCalled()
})
