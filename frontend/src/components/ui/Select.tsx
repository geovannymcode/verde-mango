import { FormField } from './FormField'
import { useFieldAccessibility } from '@/hooks/useFieldAccessibility'
import { forwardRef, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string
  label?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, id, className = '', 'aria-describedby': describedBy, children, ...props },
  ref,
) {
  const field = useFieldAccessibility(id, error, describedBy)

  return (
    <FormField id={field.id} label={label} error={error}>
      <div className="relative">
        <select
          {...props}
          ref={ref}
          {...field}
          className={`h-11 w-full appearance-none rounded-vm-md border border-vm-line bg-vm-white px-4 pr-10 text-sm text-vm-ink focus-visible:border-vm-orange focus-visible:outline-none ${className}`}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-vm-muted" />
      </div>
    </FormField>
  )
})
