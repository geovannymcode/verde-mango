import type { components } from '@/api/openapi.gen'
import { fixtureDate } from './factories'
// Preserve envelope/pagination fields from OpenAPI; replace only their concrete data type.
export type ApiEnvelope<T> = Omit<components['schemas']['ApiResponseProductResponse'], 'data'> & {
  data: T
}
export type ApiPage<T> = Omit<
  components['schemas']['PageResponseProductListResponse'],
  'content'
> & { content: T[] }
export function apiResponse<T>(data: T): ApiEnvelope<T> {
  return { success: true, message: 'OK', timestamp: fixtureDate, data }
}
export function pageResponse<T>(rows: T[], page = 0, size = 20): ApiPage<T> {
  const totalPages = Math.ceil(rows.length / size)
  return {
    content: rows.slice(page * size, (page + 1) * size),
    page,
    size,
    totalElements: rows.length,
    totalPages,
    first: page === 0,
    last: page + 1 >= totalPages,
    hasNext: page + 1 < totalPages,
    hasPrevious: page > 0,
  }
}
