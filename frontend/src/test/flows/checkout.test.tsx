import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import type { components } from '@/api/openapi.gen'
import { checkoutSchema } from '@/lib/validators'
import { CheckoutPage } from '@/pages/CheckoutPage'
import { ToastContainer } from '@/components/ui/Toast'
import { useAuthStore } from '@/store/authStore'
import { server } from '../msw/server'
import {
  makeCart,
  makeCartItem,
  makeUser,
  makeCheckout,
  makeCheckoutValidation,
  fixtureDate,
} from '../msw/factories'
import { apiResponse } from '../msw/responses'
import { renderWithProviders } from '../utils'

const paymentUrl = 'https://checkout.wompi.co/p/test-checkout'
const address = {
  recipientName: 'Ana Prueba',
  phone: '3001234567',
  streetAddress: 'Calle 112 # 43 - 123',
  apartment: '',
  city: 'Barranquilla',
  state: '',
  postalCode: '',
  country: 'Colombia',
  instructions: '',
}
const stockMessage = "Stock insuficiente para 'Kimchi de prueba'. Disponible: 0, solicitado: 2"
function setup(reject = false) {
  useAuthStore.getState().setSession('test-access', 'test-refresh', makeUser())
  const assign = vi.fn()
  const realWindow = window
  // Production assigns href. Intercept that equivalent navigation boundary and delegate to
  // an assign spy: no real navigation and no mocking the payment API/module under test.
  const location = {
    get href() {
      return 'http://localhost:3000/checkout'
    },
    set href(url: string) {
      assign(url)
    },
    assign,
  }
  vi.stubGlobal(
    'window',
    new Proxy(realWindow, {
      get(target, key) {
        return key === 'location' ? location : Reflect.get(target, key, target)
      },
    }),
  )
  const requests: Array<{
    method: string
    url: string
    body: string
    authorization: string | null
  }> = []
  let release!: () => void
  const pending = new Promise<void>((resolve) => {
    release = resolve
  })
  server.use(
    http.get('*/api/v1/cart', () =>
      HttpResponse.json(apiResponse(makeCart({ items: [makeCartItem({ quantity: 2 })] }))),
    ),
    http.post('*/api/v1/checkout/validate', () =>
      HttpResponse.json(apiResponse(makeCheckoutValidation({ subtotal: 36000, total: 36000 }))),
    ),
    http.post('*/api/v1/checkout', async ({ request }) => {
      requests.push({
        method: request.method,
        url: request.url,
        body: await request.text(),
        authorization: request.headers.get('Authorization'),
      })
      await pending
      if (reject)
        return HttpResponse.json(
          {
            success: false,
            message: stockMessage,
            errorCode: 'INSUFFICIENT_STOCK',
            timestamp: fixtureDate,
          },
          { status: 409 },
        )
      return HttpResponse.json(apiResponse(makeCheckout({ paymentUrl })))
    }),
  )
  return {
    ...renderWithProviders(
      <>
        <CheckoutPage />
        <ToastContainer />
      </>,
      { initialEntries: ['/checkout'] },
    ),
    requests,
    release,
    assign,
  }
}
async function fillAddress(context: ReturnType<typeof setup>, group: string) {
  const fields = within(screen.getByRole('group', { name: group }))
  await context.user.type(fields.getByLabelText('Nombre del destinatario'), address.recipientName)
  await context.user.type(fields.getByLabelText('Teléfono'), address.phone)
  await context.user.type(fields.getByLabelText('Dirección'), address.streetAddress)
  await context.user.type(fields.getByLabelText('Ciudad'), address.city)
}
async function fill(context: ReturnType<typeof setup>) {
  await screen.findByText('Kimchi de prueba × 2')
  await waitFor(() => expect(context.queryClient.isFetching()).toBe(0))
  await fillAddress(context, 'Dirección de envío')
}
const expectedPayload = {
  shippingAddress: address,
  billingSameAsShipping: true,
  paymentMethod: 'CARD',
} satisfies components['schemas']['CheckoutRequest']
async function assertRequest(context: ReturnType<typeof setup>, notes?: string) {
  await waitFor(() => expect(context.requests).toHaveLength(1))
  expect(context.requests[0]).toMatchObject({
    method: 'POST',
    url: 'http://localhost:3000/api/v1/checkout',
    authorization: 'Bearer test-access',
  })
  // Exact deep equality rejects extra billing/UI fields; generated type checks the contract.
  expect(JSON.parse(context.requests[0]!.body)).toEqual({
    ...expectedPayload,
    ...(notes ? { customerNotes: notes } : {}),
  })
}
describe('checkout → pasarela', () => {
  // BUG-9B-04: solo dirección de envío, sin validación invisible de facturación.
  it('envía con facturación igual al envío y redirige a la URL devuelta', async () => {
    const context = setup()
    await fill(context)
    await context.user.click(screen.getByRole('button', { name: 'Pagar con Wompi' }))
    await assertRequest(context)
    context.release()
    await waitFor(() => expect(context.assign).toHaveBeenCalledExactlyOnceWith(paymentUrl))
  })
  it('ningún campo oculto de facturación bloquea el envío', async () => {
    const context = setup()
    await fill(context)
    expect(screen.queryByRole('group', { name: 'Facturación' })).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    // Stale/extra UI data cannot resurrect validation for removed hidden fields.
    expect(
      checkoutSchema.safeParse({
        shippingAddress: address,
        paymentMethod: 'CARD',
        billingAddress: {},
      }).success,
    ).toBe(true)
    await context.user.click(screen.getByRole('button', { name: 'Pagar con Wompi' }))
    await assertRequest(context)
    context.release()
    await waitFor(() => expect(context.assign).toHaveBeenCalledExactlyOnceWith(paymentUrl))
  })
  it('envía exactamente el DTO de checkout, incluidas notas opcionales', async () => {
    const context = setup()
    await fill(context)
    await context.user.type(
      screen.getByLabelText('Notas para el pedido (opcional)'),
      'Entregar por la mañana',
    )
    await context.user.click(screen.getByRole('button', { name: 'Pagar con Wompi' }))
    await assertRequest(context, 'Entregar por la mañana')
    context.release()
    await waitFor(() => expect(context.assign).toHaveBeenCalledExactlyOnceWith(paymentUrl))
  })
  it('muestra todos los errores de campos requeridos y no envía datos inválidos', async () => {
    const context = setup()
    await screen.findByText('Kimchi de prueba × 2')
    await context.user.clear(screen.getByLabelText('País'))
    await context.user.click(screen.getByRole('button', { name: 'Pagar con Wompi' }))
    for (const [label, message] of [
      ['Nombre del destinatario', 'El nombre del destinatario es requerido'],
      ['Teléfono', 'El teléfono es requerido'],
      ['Dirección', 'La dirección es requerida'],
      ['Ciudad', 'La ciudad es requerida'],
      ['País', 'El país es requerido'],
    ]) {
      expect(await screen.findByText(message!)).toBeVisible()
      expect(screen.getByLabelText(label!)).toHaveAccessibleDescription(message!)
    }
    expect(context.requests).toEqual([])
    expect(context.assign).not.toHaveBeenCalled()
  })
  it.each([
    ['Apartamento / referencia (opcional)', 101],
    ['Departamento', 101],
    ['Código postal', 21],
    ['Instrucciones de entrega (opcional)', 301],
    ['Notas para el pedido (opcional)', 501],
  ] as const)('muestra el error de longitud del campo opcional %s', async (label, length) => {
    const context = setup()
    await fill(context)
    const input = screen.getByLabelText(label)
    // Simulates pasting a long value, without spending time on hundreds of keystrokes.
    fireEvent.change(input, { target: { value: 'a'.repeat(length) } })
    await context.user.click(screen.getByRole('button', { name: 'Pagar con Wompi' }))
    await waitFor(() => expect(input).toHaveAttribute('aria-invalid', 'true'))
    expect(input).toHaveAccessibleDescription()
    const descriptionId = input.getAttribute('aria-describedby')!
    expect(document.getElementById(descriptionId)).toBeVisible()
    expect(context.requests).toEqual([])
    expect(context.assign).not.toHaveBeenCalled()
  })
  it('muestra el producto y stock rechazados por el servidor sin navegar', async () => {
    const context = setup(true)
    await fill(context)
    await context.user.click(screen.getByRole('button', { name: 'Pagar con Wompi' }))
    await assertRequest(context)
    context.release()
    expect(await screen.findByRole('status')).toHaveTextContent(stockMessage)
    expect(context.assign).not.toHaveBeenCalled()
    expect(screen.getByText('Kimchi de prueba × 2')).toBeVisible()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Pagar con Wompi' })).toBeEnabled(),
    )
    expect(context.requests).toHaveLength(1)
  })
  it('un doble clic mientras el servidor responde produce una sola petición', async () => {
    const context = setup()
    await fill(context)
    await context.user.dblClick(screen.getByRole('button', { name: 'Pagar con Wompi' }))
    await assertRequest(context)
    expect(screen.getByRole('button', { name: 'Procesando…' })).toBeDisabled()
    context.release()
    await waitFor(() => expect(context.assign).toHaveBeenCalledExactlyOnceWith(paymentUrl))
    await waitFor(() => expect(context.queryClient.isMutating()).toBe(0))
    expect(context.requests).toHaveLength(1)
  })
})
