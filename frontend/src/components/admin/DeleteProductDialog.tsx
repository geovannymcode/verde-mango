import type { ProductResponse } from '@/api/schema'
import { useDeleteProduct, useDeactivateProduct } from '@/features/admin/catalogHooks'
import { adminErrorMessage } from '@/lib/adminErrors'
import { useUiStore } from '@/store/uiStore'
import { ConfirmDialog } from './ConfirmDialog'
import { Button } from '@/components/ui/Button'
export function DeleteProductDialog({
  product,
  onClose,
}: {
  product: ProductResponse
  onClose: () => void
}) {
  const remove = useDeleteProduct()
  const deactivate = useDeactivateProduct()
  const error = remove.error ?? deactivate.error
  const referenced = remove.error && /orden|pedido|referenci/i.test(remove.error.message)
  function done() {
    useUiStore.getState().pushToast({ message: 'Producto desactivado.', variant: 'success' })
    onClose()
  }
  return (
    <ConfirmDialog
      open
      title="Eliminar producto"
      description="El backend realiza una desactivación: el producto dejará de aparecer en la tienda. Confirma el nombre exacto para continuar."
      requiredText={product.name}
      confirmText="Eliminar producto"
      pending={remove.isPending || deactivate.isPending}
      error={error ? adminErrorMessage(error) : undefined}
      onCancel={onClose}
      onConfirm={() => remove.mutate(product.id, { onSuccess: done })}
      errorAction={
        referenced ? (
          <Button
            className="mt-4"
            disabled={deactivate.isPending}
            onClick={() => deactivate.mutate(product.id, { onSuccess: done })}
          >
            Desactivar en lugar de borrar
          </Button>
        ) : undefined
      }
    />
  )
}
