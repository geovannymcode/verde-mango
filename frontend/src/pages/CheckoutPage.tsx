import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { useCart, useCheckout, useCheckoutValidation } from '@/features/cart/hooks'
import { checkoutSchema, type CheckoutFormValues } from '@/lib/validators'
import { formatCurrency } from '@/lib/formatters'
import { redirectToWompiCheckout } from '@/api/payment'
import { useUiStore } from '@/store/uiStore'
import { ApiError } from '@/api/types'
import { SectionTitle } from '@/components/layout/SectionTitle'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'

const emptyAddress = {
  recipientName: '',
  phone: '',
  streetAddress: '',
  apartment: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'Colombia',
  instructions: '',
}

// El backend define `paymentMethod` como un string libre (`CheckoutDtos.kt`), sin un enum
// de métodos soportados. Estas opciones asumen los métodos típicos del Web Checkout de Wompi.
const PAYMENT_METHODS = [
  { value: 'CARD', label: 'Tarjeta de crédito o débito' },
  { value: 'PSE', label: 'PSE' },
  { value: 'NEQUI', label: 'Nequi' },
]

export function CheckoutPage() {
  const navigate = useNavigate()
  const pushToast = useUiStore((state) => state.pushToast)

  const cartQuery = useCart()
  const validationQuery = useCheckoutValidation(true)
  const checkout = useCheckout()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      shippingAddress: emptyAddress,
      billingSameAsShipping: true,
      billingAddress: emptyAddress,
      billingTaxId: '',
      customerNotes: '',
      paymentMethod: 'CARD',
    },
  })

  const billingSameAsShipping = watch('billingSameAsShipping')

  if (cartQuery.data && cartQuery.data.items.length === 0) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 py-20 text-center sm:px-6">
        <SectionTitle eyebrow="pago" title="Tu carrito está vacío" align="center" />
        <Link to="/tienda">
          <Button variant="outline">Ir a la tienda</Button>
        </Link>
      </div>
    )
  }

  function submit(values: CheckoutFormValues) {
    checkout.mutate(
      {
        shippingAddress: values.shippingAddress,
        billingSameAsShipping: values.billingSameAsShipping,
        billingAddress: values.billingSameAsShipping ? undefined : values.billingAddress,
        billingTaxId: values.billingTaxId || undefined,
        customerNotes: values.customerNotes || undefined,
        paymentMethod: values.paymentMethod,
      },
      {
        onSuccess: (response) => {
          if (response.paymentUrl) {
            redirectToWompiCheckout(response.paymentUrl)
            return
          }
          // Ver docs/api-gaps.md: hoy el backend no implementa Wompi real y `paymentUrl`
          // siempre llega null. Se informa el error en vez de navegar a ningún lado.
          pushToast({
            message:
              'La orden se creó, pero el backend no devolvió una URL de pago (Wompi no está implementado aún).',
            variant: 'error',
          })
          navigate(`/checkout/resultado?reference=${response.orderNumber}`)
        },
        onError: (error) => {
          const message =
            error instanceof ApiError ? error.message : 'No pudimos procesar tu compra.'
          pushToast({ message, variant: 'error' })
        },
      },
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <SectionTitle eyebrow="pago" title="Finalizar compra" />

      {validationQuery.data && !validationQuery.data.valid && (
        <div className="mt-6 flex items-start gap-3 rounded-vm-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          <AlertTriangle size={20} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Hay problemas con tu carrito</p>
            <ul className="mt-1 list-inside list-disc">
              {validationQuery.data.errors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(submit)} className="mt-8 flex flex-col gap-10 md:flex-row">
        <div className="flex flex-1 flex-col gap-8">
          <fieldset className="flex flex-col gap-4">
            <legend className="mb-1 font-bold text-vm-ink">Dirección de envío</legend>
            <Input
              label="Nombre del destinatario"
              {...register('shippingAddress.recipientName')}
              error={errors.shippingAddress?.recipientName?.message}
            />
            <Input
              label="Teléfono"
              {...register('shippingAddress.phone')}
              error={errors.shippingAddress?.phone?.message}
            />
            <Input
              label="Dirección"
              {...register('shippingAddress.streetAddress')}
              error={errors.shippingAddress?.streetAddress?.message}
            />
            <Input label="Apartamento / referencia (opcional)" {...register('shippingAddress.apartment')} />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Ciudad"
                {...register('shippingAddress.city')}
                error={errors.shippingAddress?.city?.message}
              />
              <Input label="Departamento" {...register('shippingAddress.state')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Código postal" {...register('shippingAddress.postalCode')} />
              <Input
                label="País"
                {...register('shippingAddress.country')}
                error={errors.shippingAddress?.country?.message}
              />
            </div>
            <Input
              label="Instrucciones de entrega (opcional)"
              {...register('shippingAddress.instructions')}
            />
          </fieldset>

          <fieldset className="flex flex-col gap-4">
            <legend className="mb-1 font-bold text-vm-ink">Facturación</legend>
            <label className="flex items-center gap-2 text-sm text-vm-ink">
              <input type="checkbox" {...register('billingSameAsShipping')} />
              La dirección de facturación es la misma que la de envío
            </label>

            {!billingSameAsShipping && (
              <div className="flex flex-col gap-4">
                <Input
                  label="Nombre del destinatario"
                  {...register('billingAddress.recipientName')}
                  error={errors.billingAddress?.recipientName?.message}
                />
                <Input
                  label="Teléfono"
                  {...register('billingAddress.phone')}
                  error={errors.billingAddress?.phone?.message}
                />
                <Input
                  label="Dirección"
                  {...register('billingAddress.streetAddress')}
                  error={errors.billingAddress?.streetAddress?.message}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Ciudad"
                    {...register('billingAddress.city')}
                    error={errors.billingAddress?.city?.message}
                  />
                  <Input
                    label="País"
                    {...register('billingAddress.country')}
                    error={errors.billingAddress?.country?.message}
                  />
                </div>
              </div>
            )}

            <Input label="NIT / documento de facturación (opcional)" {...register('billingTaxId')} />
          </fieldset>

          <fieldset className="flex flex-col gap-4">
            <legend className="mb-1 font-bold text-vm-ink">Pago</legend>
            <Select label="Método de pago" {...register('paymentMethod')}>
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </Select>
            <Input label="Notas para el pedido (opcional)" {...register('customerNotes')} />
          </fieldset>
        </div>

        <div className="flex h-fit w-full flex-col gap-4 rounded-vm-lg border border-vm-line p-5 md:w-72">
          <p className="font-bold text-vm-ink">Resumen del pedido</p>
          {cartQuery.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <>
              <ul className="flex flex-col gap-2 text-sm">
                {cartQuery.data?.items.map((item) => (
                  <li key={item.productId} className="flex justify-between gap-2">
                    <span className="text-vm-muted">
                      {item.productName} × {item.quantity}
                    </span>
                    <span className="font-semibold text-vm-ink">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between border-t border-vm-line pt-3">
                <span className="text-sm font-semibold text-vm-ink">Subtotal</span>
                <span className="text-lg font-extrabold text-vm-ink">
                  {formatCurrency(cartQuery.data?.subtotal ?? 0)}
                </span>
              </div>
            </>
          )}

          <Button
            type="submit"
            disabled={
              checkout.isPending || (validationQuery.data && !validationQuery.data.valid)
            }
          >
            {checkout.isPending ? 'Procesando…' : 'Pagar con Wompi'}
          </Button>
        </div>
      </form>
    </div>
  )
}
