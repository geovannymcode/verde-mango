import { useState } from 'react'
import type { OrderStatus } from '@/api/schema'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Input } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { statusLabels } from '@/lib/adminStatus'
import { useUiStore } from '@/store/uiStore'
import { orderTransitions, canTransition } from './transitions'
import { useUpdateOrderStatus } from './hooks'
export function OrderStatusControl({
  id,
  number,
  status,
}: {
  id: number
  number: string
  status: OrderStatus
}) {
  const mutation = useUpdateOrderStatus(id)
  const [target, setTarget] = useState<OrderStatus | ''>('')
  const [open, setOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [tracking, setTracking] = useState('')
  const [carrier, setCarrier] = useState('')
  const [failure, setFailure] = useState<string>()
  const toast = useUiStore((s) => s.pushToast)
  const destinations: readonly OrderStatus[] = orderTransitions[status]
  const valid = target !== '' && canTransition(status, target)
  function submit() {
    if (!valid || !target) return
    setFailure(undefined)
    mutation.mutate(
      {
        status: target,
        comment: comment.trim() || undefined,
        ...(target === 'SHIPPED'
          ? { trackingNumber: tracking.trim() || undefined, carrier: carrier.trim() || undefined }
          : {}),
      },
      {
        onSuccess: () => {
          setOpen(false)
          setTarget('')
          setComment('')
          toast({ message: 'Estado de la orden actualizado.', variant: 'success' })
        },
        onError: (error) => setFailure(error.message),
      },
    )
  }
  return (
    <div className="space-y-3">
      {destinations.length === 0 ? (
        <p className="font-semibold">Estado final: no hay transiciones disponibles.</p>
      ) : (
        <div className="flex flex-wrap items-end gap-3">
          <Select
            id="order-destination"
            label="Cambiar estado"
            value={valid ? target : ''}
            disabled={mutation.isPending}
            onChange={(e) => setTarget(e.target.value as OrderStatus | '')}
          >
            <option value="">Selecciona un destino</option>
            {destinations.map((s) => (
              <option key={s} value={s}>
                {statusLabels[s]}
              </option>
            ))}
          </Select>
          <Button
            disabled={!valid || mutation.isPending}
            onClick={() => {
              setFailure(undefined)
              setOpen(true)
            }}
          >
            Revisar cambio
          </Button>
        </div>
      )}
      <ConfirmDialog
        open={open}
        title="Confirmar cambio de estado"
        description={`Vas a pasar la orden ${number} de ${status} (${statusLabels[status]}) a ${target} (${target ? statusLabels[target] : ''}).`}
        confirmText="Aplicar cambio"
        pending={mutation.isPending}
        confirmDisabled={!valid}
        error={failure}
        onConfirm={submit}
        onCancel={() => setOpen(false)}
      >
        {(target === 'CANCELLED' || target === 'DELIVERED' || target === 'REFUNDED') && (
          <p className="mt-4 rounded bg-amber-50 p-3 text-sm text-amber-900">
            Este cambio no puede deshacerse volviendo al estado anterior.
          </p>
        )}
        {target === 'REFUNDED' && (
          <p className="mt-3 text-sm font-semibold">
            Solo se registra el estado Reembolsada. Esto no devuelve dinero ni ejecuta un reembolso
            en Wompi.
          </p>
        )}
        {target === 'CONFIRMED' && (
          <p className="mt-3 text-sm">
            Confirmar registra una fecha de pago en la orden. No verifica ni cobra una transacción
            en la pasarela.
          </p>
        )}
        {!valid && (
          <p role="alert">El estado cambió. Cierra este diálogo y elige un destino válido.</p>
        )}
        <div className="mt-4">
          <Textarea
            id="order-note"
            label="Nota (opcional)"
            maxLength={500}
            value={comment}
            disabled={mutation.isPending}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
        {target === 'SHIPPED' && (
          <div className="mt-4 grid gap-3">
            <Input
              id="order-tracking"
              label="Número de guía (opcional)"
              maxLength={100}
              value={tracking}
              disabled={mutation.isPending}
              onChange={(e) => setTracking(e.target.value)}
            />
            <Input
              id="order-carrier"
              label="Transportadora (opcional)"
              maxLength={100}
              value={carrier}
              disabled={mutation.isPending}
              onChange={(e) => setCarrier(e.target.value)}
            />
          </div>
        )}
      </ConfirmDialog>
    </div>
  )
}
