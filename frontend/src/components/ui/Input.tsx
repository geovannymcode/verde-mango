import { FormField } from './FormField'
import { useFieldAccessibility } from '@/hooks/useFieldAccessibility'
import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, id, className = '', 'aria-describedby': describedBy, ...props },
  ref,
) {
  const field = useFieldAccessibility(id, error, describedBy)

  return (
    <FormField id={field.id} label={label} error={error}>
      <input
        {...props}
        ref={ref}
        {...field}
        className={`h-11 rounded-vm-md border border-vm-line bg-vm-white px-4 text-sm text-vm-ink placeholder:text-vm-muted focus-visible:border-vm-orange focus-visible:outline-none ${error ? 'border-red-400' : ''} ${className}`}
      />
    </FormField>
  )
})
