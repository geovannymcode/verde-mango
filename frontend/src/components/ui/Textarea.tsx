import { FormField } from './FormField'
import { useFieldAccessibility } from '@/hooks/useFieldAccessibility'
import { forwardRef, type TextareaHTMLAttributes } from 'react'
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, id, className = '', 'aria-describedby': describedBy, ...props },
  ref,
) {
  const field = useFieldAccessibility(id, error, describedBy)
  return (
    <FormField id={field.id} label={label} error={error}>
      <textarea
        {...props}
        ref={ref}
        {...field}
        className={`min-h-36 w-full resize-y rounded-vm-md border border-vm-line bg-vm-white px-4 py-3 text-sm text-vm-ink placeholder:text-vm-muted focus-visible:border-vm-orange ${error ? 'border-red-400' : ''} ${className}`}
      />
    </FormField>
  )
})
