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

export type ApiErrorBody = {
  success: false
  message: string
  errorCode?: string
  timestamp: string
  path?: string
  errors?: Record<string, string>
}

export class ApiError extends Error {
  readonly status: number | undefined
  readonly errorCode: string | undefined
  readonly fieldErrors: Record<string, string> | undefined

  constructor(
    message: string,
    options?: { status?: number; errorCode?: string; fieldErrors?: Record<string, string> },
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = options?.status
    this.errorCode = options?.errorCode
    this.fieldErrors = options?.fieldErrors
  }
}
