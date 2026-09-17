import { forwardRef, type TextareaHTMLAttributes } from 'react'
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, id, className = '', ...props },
  ref,
) {
  const fieldId = id ?? props.name
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-medium text-vm-ink">
        {label}
      </label>
      <textarea
        {...props}
        ref={ref}
        id={fieldId}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={`min-h-36 w-full resize-y rounded-vm-md border border-vm-line bg-vm-white px-4 py-3 text-sm text-vm-ink placeholder:text-vm-muted focus-visible:border-vm-orange ${error ? 'border-red-400' : ''} ${className}`}
      />
      {error && (
        <span id={`${fieldId}-error`} className="text-xs text-red-500">
          {error}
        </span>
      )}
    </div>
  )
})
