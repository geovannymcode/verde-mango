import { afterEach, expect, it, vi } from 'vitest'
import { httpClient } from './client'
import { getAdminOrders, getAdminOrderStats } from './admin'
import { adminErrorMessage, applyAdminFormError } from '@/lib/adminErrors'
import { ApiError } from './types'
import type { UseFormSetError } from 'react-hook-form'
afterEach(() => vi.restoreAllMocks())
it('uses only the real admin list/stats contracts', async () => {
  const get = vi
    .spyOn(httpClient, 'get')
    .mockResolvedValue({ data: { success: true, data: { totalElements: 17 } } })
  await getAdminOrders({ status: 'SHIPPED', size: 1 })
  expect(get).toHaveBeenLastCalledWith('/api/v1/admin/orders', {
    params: { status: 'SHIPPED', size: 1, page: 0 },
  })
  await getAdminOrderStats()
  expect(get).toHaveBeenLastCalledWith('/api/v1/admin/orders/stats', { params: {} })
})
it('maps known backend fields and always prioritizes permissions on 403', () => {
  const setError = vi.fn<UseFormSetError<{ name: string }>>()
  const error = new ApiError('Revisa los datos', {
    status: 400,
    fieldErrors: [
      { field: 'name', message: 'Nombre duplicado' },
      { field: 'unknown', message: 'Otro' },
    ],
  })
  applyAdminFormError<{ name: string }>(error, setError, ['name'])
  expect(setError).toHaveBeenCalledExactlyOnceWith('name', {
    type: 'server',
    message: 'Nombre duplicado',
  })
  expect(adminErrorMessage(new ApiError('Forbidden', { status: 403 }))).toContain(
    'No tienes permisos',
  )
})
