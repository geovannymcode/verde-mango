export type ApiResponse<T> = {
  success: boolean
  message: string | null
  data: T
  timestamp?: string
  path?: string
}

export type PageResponse<T> = {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
  hasNext: boolean
  hasPrevious: boolean
}

// Forma real de `GlobalExceptionHandler.kt`: `errors` es un array de `FieldError` (no un mapa),
// ver `common/domain/ErrorResponse.kt` (`errors: List<FieldError>?`).
export type FieldError = {
  field: string
  message: string
  rejectedValue?: unknown
}

export type ApiErrorBody = {
  success: false
  message: string
  errorCode?: string
  timestamp: string
  path?: string
  errors?: FieldError[]
}

export class ApiError extends Error {
  readonly status: number | undefined
  readonly errorCode: string | undefined
  // Se colapsa el array de FieldError del backend a un mapa `campo -> primer mensaje`, más
  // cómodo para mapear a `setError` de React Hook Form.
  readonly fieldErrors: Record<string, string> | undefined

  constructor(
    message: string,
    options?: { status?: number; errorCode?: string; fieldErrors?: FieldError[] },
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = options?.status
    this.errorCode = options?.errorCode
    this.fieldErrors = options?.fieldErrors?.reduce<Record<string, string>>((acc, error) => {
      if (!(error.field in acc)) acc[error.field] = error.message
      return acc
    }, {})
  }
}
