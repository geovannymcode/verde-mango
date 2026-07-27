import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  side?: 'left' | 'right'
  children: ReactNode
}

export function Drawer({ open, onClose, title, side = 'right', children }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    panelRef.current?.focus()
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex bg-vm-ink/40" onClick={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className={`flex h-full w-full max-w-sm flex-col bg-vm-white shadow-vm-card focus:outline-none ${
          side === 'right' ? 'ml-auto' : ''
        }`}
      >
        <div className="flex items-center justify-between border-b border-vm-line px-5 py-4">
          {title && <h2 className="text-base font-bold text-vm-ink">{title}</h2>}
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="rounded-vm-full p-1 text-vm-muted hover:bg-vm-cream hover:text-vm-ink"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
