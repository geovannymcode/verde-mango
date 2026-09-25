import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { useOrder } from '@/features/cart/hooks'
import { parseWompiReturnParams } from '@/api/payment'
import { formatCurrency } from '@/lib/formatters'
import { SectionTitle } from '@/components/layout/SectionTitle'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'

// Ver docs/api-gaps.md ("Fase 4 — No existe integración real con Wompi en el backend"): no
// hay forma verificada de saber los nombres exactos de los query params de retorno de Wompi,
// así que nunca confiamos solo en `status` de la URL. Usamos `reference` (el orderNumber) para
// hacer polling contra GET /api/v1/orders/{orderNumber}, que es la fuente real de verdad.
const PENDING_STATUSES = new Set(['PENDING'])
const APPROVED_STATUSES = new Set(['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'])
const REJECTED_STATUSES = new Set(['CANCELLED', 'REFUNDED'])

export function CheckoutResultPage() {
  useDocumentTitle('Resultado del pedido', 'Consulta el estado de tu pedido en Verde Mango.')
  const [searchParams] = useSearchParams()
  const wompiParams = useMemo(() => parseWompiReturnParams(searchParams), [searchParams])
  const orderNumber = wompiParams.reference ?? searchParams.get('reference') ?? undefined

  const orderQuery = useOrder(orderNumber, {
    refetchInterval: (query) =>
      query.state.data && PENDING_STATUSES.has(query.state.data.status) ? 3000 : false,
  })

  if (!orderNumber) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 py-20 text-center sm:px-6">
        <SectionTitle eyebrow="pago" title="No pudimos identificar tu pedido" align="center" />
        <p className="text-vm-muted">
          Falta el parámetro <code>reference</code> en la URL de retorno.
        </p>
        <Link to="/tienda">
          <Button variant="outline">Volver a la tienda</Button>
        </Link>
      </div>
    )
  }

  if (orderQuery.isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 py-20 text-center sm:px-6">
        <SectionTitle eyebrow="pago" title="No encontramos tu pedido" align="center" />
        <p className="text-vm-muted">
          No pudimos consultar el pedido <strong>{orderNumber}</strong>.
        </p>
        <Link to="/cuenta">
          <Button variant="outline">Ir a mi cuenta</Button>
        </Link>
      </div>
    )
  }

  const order = orderQuery.data
  const isPending = PENDING_STATUSES.has(order.status)
  const isApproved = APPROVED_STATUSES.has(order.status)
  const isRejected = REJECTED_STATUSES.has(order.status)

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6">
      {isPending && (
        <>
          <Clock size={56} className="text-vm-orange" />
          <SectionTitle eyebrow="pago" title="Estamos confirmando tu pago" align="center" />
          <p className="text-vm-muted">Esto puede tardar unos segundos. No cierres esta página.</p>
        </>
      )}

      {isApproved && (
        <>
          <CheckCircle2 size={56} className="text-vm-green" />
          <SectionTitle eyebrow="pago aprobado" title="¡Gracias por tu compra!" align="center" />
          <p className="text-vm-muted">
            Tu pedido <strong>{order.orderNumber}</strong> fue confirmado por{' '}
            {formatCurrency(order.totalAmount)}.
          </p>
        </>
      )}

      {isRejected && (
        <>
          <XCircle size={56} className="text-red-500" />
          <SectionTitle
            eyebrow="pago rechazado"
            title="No pudimos procesar tu pago"
            align="center"
          />
          <p className="text-vm-muted">
            El pedido <strong>{order.orderNumber}</strong> quedó en estado{' '}
            <strong>{order.statusLabel}</strong>.
          </p>
        </>
      )}

      {!isPending && !isApproved && !isRejected && (
        <>
          <SectionTitle eyebrow="pago" title={order.statusLabel} align="center" />
          <p className="text-vm-muted">
            Pedido <strong>{order.orderNumber}</strong>.
          </p>
        </>
      )}

      <div className="flex gap-3">
        <Link to="/cuenta">
          <Button variant="outline">Ver mis pedidos</Button>
        </Link>
        <Link to="/tienda">
          <Button>Seguir comprando</Button>
        </Link>
      </div>
    </div>
  )
}
