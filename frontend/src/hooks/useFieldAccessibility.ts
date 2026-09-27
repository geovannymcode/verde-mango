import { useId } from 'react'

export function useFieldAccessibility(id?: string, error?: string, describedBy?: string) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  return {
    id: fieldId,
    'aria-invalid': !!error,
    'aria-describedby':
      [describedBy, error ? `${fieldId}-error` : undefined].filter(Boolean).join(' ') || undefined,
  }
}
