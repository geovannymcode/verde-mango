import { useEffect } from 'react'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useUiStore } from '@/store/uiStore'

type ToastVariant = 'success' | 'error' | 'info'

const iconByVariant: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

const colorByVariant: Record<ToastVariant, string> = {
  success: 'text-vm-green',
  error: 'text-red-500',
  info: 'text-vm-orange',
}

export function ToastContainer() {
  const toasts = useUiStore((state) => state.toasts)
  const dismissToast = useUiStore((state) => state.dismissToast)

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          message={toast.message}
          variant={toast.variant ?? 'info'}
          onDismiss={dismissToast}
        />
      ))}
    </div>
  )
}

function ToastItem({
  id,
  message,
  variant,
  onDismiss,
}: {
  id: string
  message: string
  variant: ToastVariant
  onDismiss: (id: string) => void
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), 4000)
    return () => clearTimeout(timer)
  }, [id, onDismiss])

  const Icon = iconByVariant[variant]

  return (
    <div
      role="status"
      className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-vm-md border border-vm-line bg-vm-white px-4 py-3 shadow-vm-card"
    >
      <Icon size={18} className={colorByVariant[variant]} />
      <p className="flex-1 text-sm text-vm-ink">{message}</p>
      <button
        type="button"
        aria-label="Cerrar notificación"
        onClick={() => onDismiss(id)}
        className="text-vm-muted hover:text-vm-ink"
      >
        <X size={16} />
      </button>
    </div>
  )
}
