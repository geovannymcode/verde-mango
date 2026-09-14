import { useCallback, type FormEventHandler, type ReactNode } from 'react'
import { useBeforeUnload, useBlocker } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from './ConfirmDialog'
interface FormShellProps {
  title: string
  description?: string
  children: ReactNode
  isDirty: boolean
  isSubmitting: boolean
  onSubmit: FormEventHandler<HTMLFormElement>
  onCancel: () => void
  error?: string
  submitLabel?: string
  actions?: ReactNode
}
export function FormShell({
  title,
  description,
  children,
  isDirty,
  isSubmitting,
  onSubmit,
  onCancel,
  error,
  submitLabel = 'Guardar cambios',
  actions,
}: FormShellProps) {
  const blocker = useBlocker(isDirty)
  useBeforeUnload(
    useCallback(
      (event: BeforeUnloadEvent) => {
        if (isDirty) {
          event.preventDefault()
          event.returnValue = ''
        }
      },
      [isDirty],
    ),
  )
  return (
    <>
      <form
        onSubmit={onSubmit}
        noValidate
        aria-label={title}
        aria-busy={isSubmitting}
        className="space-y-6"
      >
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {description && <p className="mt-2 text-sm text-vm-muted">{description}</p>}
        </div>
        {error && (
          <p role="alert" className="rounded-md border border-red-200 p-4 text-sm text-red-700">
            {error}
          </p>
        )}
        <fieldset disabled={isSubmitting} className="min-w-0 space-y-6">
          {children}
        </fieldset>
        <div className="flex flex-wrap justify-end gap-3 border-t border-vm-line pt-5">
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCancel}>
            Cancelar
          </Button>
          {actions}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando…' : submitLabel}
          </Button>
        </div>
      </form>
      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title="¿Salir sin guardar?"
        description="Hay cambios sin guardar. Si sales ahora se perderán."
        confirmText="Salir sin guardar"
        pending={isSubmitting}
        onConfirm={() => blocker.state === 'blocked' && blocker.proceed()}
        onCancel={() => blocker.state === 'blocked' && blocker.reset()}
      />
    </>
  )
}
