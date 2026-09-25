import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAdminOrder, updateAdminOrderStatus } from '@/api/admin'
import type { UpdateOrderStatusRequest } from '@/api/schema'
import { ApiError } from '@/api/types'
import { adminKeys } from '../keys'
import { invalidateOrders, publishOrderChange } from './sync'
export function useAdminOrder(id: number) {
  return useQuery({
    queryKey: adminKeys.orderDetail(id),
    queryFn: () => getAdminOrder(id),
    enabled: Number.isSafeInteger(id) && id > 0,
    retry: (count, error) =>
      !(error instanceof ApiError && [401, 403, 404].includes(error.status ?? 0)) && count < 1,
  })
}
export function useUpdateOrderStatus(id: number) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateOrderStatusRequest) => updateAdminOrderStatus(id, data),
    retry: false,
    onSuccess: async () => {
      publishOrderChange()
      await invalidateOrders(client)
    },
    onError: async () => {
      await client.invalidateQueries({ queryKey: adminKeys.orderDetail(id) })
    },
  })
}
