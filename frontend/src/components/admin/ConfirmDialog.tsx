import { useId, useState, type ReactNode } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmText?: string
  requiredText?: string
  pending?: boolean
  confirmDisabled?: boolean
  error?: string
  errorAction?: ReactNode
  children?: ReactNode
  onConfirm: () => void
  onCancel: () => void
}
function ConfirmationContent({
  title,
  description,
  confirmText = 'Confirmar',
  requiredText,
  pending,
  confirmDisabled,
  error,
  errorAction,
  children,
  onConfirm,
  onCancel,
}: Omit<ConfirmDialogProps, 'open'>) {
  const [value, setValue] = useState('')
  const id = useId()
  return (
    <Modal
      open
      onClose={() => {
        if (!pending) onCancel()
      }}
      title={title}
    >
      <p className="text-sm leading-relaxed text-vm-muted">{description}</p>
      {requiredText !== undefined && (
        <div className="mt-5">
          <Input
            id={id}
            label={`Escribe «${requiredText}» para confirmar`}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            autoComplete="off"
            disabled={pending}
          />
        </div>
      )}
      {children}
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}
      {errorAction}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <Button variant="outline" disabled={pending} onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          disabled={
            pending || confirmDisabled || (requiredText !== undefined && value !== requiredText)
          }
          onClick={onConfirm}
        >
          {pending ? 'Procesando…' : confirmText}
        </Button>
      </div>
    </Modal>
  )
}
export function ConfirmDialog({ open, ...props }: ConfirmDialogProps) {
  return open ? <ConfirmationContent key={props.requiredText ?? props.title} {...props} /> : null
}
