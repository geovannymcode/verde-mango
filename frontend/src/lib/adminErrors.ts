import type { FieldPath, FieldValues, UseFormSetError } from 'react-hook-form'
import { ApiError } from '@/api/types'
export function adminErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 403)
    return 'No tienes permisos para realizar esta acción. Solicita al administrador que revise el acceso de tu cuenta.'
  return error instanceof Error
    ? error.message
    : 'No pudimos completar la acción. Inténtalo de nuevo.'
}
/** Only known form paths are mapped; unknown fields remain a visible global error. */
export function applyAdminFormError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly FieldPath<T>[],
): string {
  if (error instanceof ApiError && error.status !== 403) {
    for (const field of fields) {
      const message = error.fieldErrors?.[field]
      if (message) setError(field, { type: 'server', message })
    }
  }
  return adminErrorMessage(error)
}
