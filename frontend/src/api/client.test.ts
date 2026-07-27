import { describe, expect, it } from 'vitest'
import type { AxiosResponse } from 'axios'
import { unwrap } from './client'
import { ApiError, type ApiResponse } from './types'

function buildResponse<T>(body: ApiResponse<T>): AxiosResponse<ApiResponse<T>> {
  return {
    data: body,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as AxiosResponse['config'],
  }
}

describe('unwrap', () => {
  it('devuelve data cuando success es true', () => {
    const response = buildResponse({ success: true, message: null, data: { id: 1 } })
    expect(unwrap(response)).toEqual({ id: 1 })
  })

  it('lanza ApiError cuando success es false', () => {
    const response = buildResponse({ success: false, message: 'Error', data: null })
    expect(() => unwrap(response)).toThrow(ApiError)
  })
})
