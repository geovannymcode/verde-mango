import { FormField } from './FormField'
import { useFieldAccessibility } from '@/hooks/useFieldAccessibility'
import { forwardRef, useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    { label, error, id, className = '', 'aria-describedby': describedBy, ...props },
    ref,
  ) {
    const [visible, setVisible] = useState(false)
    const field = useFieldAccessibility(id, error, describedBy)

    return (
      <FormField id={field.id} label={label} error={error}>
        <div className="relative">
          <input
            {...props}
            ref={ref}
            {...field}
            type={visible ? 'text' : 'password'}
            className={`h-11 w-full rounded-vm-md border border-vm-line bg-vm-white px-4 pr-11 text-sm text-vm-ink placeholder:text-vm-muted focus-visible:border-vm-orange focus-visible:outline-none ${error ? 'border-red-400' : ''} ${className}`}
          />
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-vm-muted hover:text-vm-ink"
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </FormField>
    )
  },
)
