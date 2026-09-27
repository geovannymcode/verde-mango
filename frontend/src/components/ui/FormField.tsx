import type { ReactNode } from 'react'

/** Shared label/error contract for native controls; preserves help-text descriptions. */
export function FormField({
  id,
  label,
  error,
  children,
}: {
  id: string
  label?: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-vm-ink">
          {label}
        </label>
      )}
      {children}
      {error && (
        <span id={`${id}-error`} role="alert" className="text-xs text-red-500">
          {error}
        </span>
      )}
    </div>
  )
}
