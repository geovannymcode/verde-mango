import { useState, useSyncExternalStore } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getOrder } from '@/api/orders'
import { orderKeys } from '@/features/cart/keys'
import { PAYMENT_POLL_INTERVAL_MS, PAYMENT_POLL_MAX_ATTEMPTS } from './constants'

function subscribeVisibility(onChange: () => void) {
  document.addEventListener('visibilitychange', onChange)
  return () => document.removeEventListener('visibilitychange', onChange)
}
const isVisible = () => document.visibilityState !== 'hidden'

export function usePaymentResult(orderNumber: string | undefined) {
  const visible = useSyncExternalStore(subscribeVisibility, isVisible, () => false)
  const [cycle, setCycle] = useState(0)
  // Query-owned counters survive renders. A different order/cycle owns a different budget.
  const query = useQuery({
    queryKey: [...orderKeys.detail(orderNumber ?? ''), 'payment-poll', cycle],
    queryFn: ({ signal }) => getOrder(orderNumber!, signal),
    enabled: (q) =>
      !!orderNumber &&
      visible &&
      q.state.dataUpdateCount + q.state.errorUpdateCount < PAYMENT_POLL_MAX_ATTEMPTS &&
      (!q.state.data || q.state.data.status === 'PENDING'),
    retry: false,
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    refetchInterval: (q) =>
      visible &&
      q.state.data?.status === 'PENDING' &&
      q.state.dataUpdateCount + q.state.errorUpdateCount < PAYMENT_POLL_MAX_ATTEMPTS
        ? PAYMENT_POLL_INTERVAL_MS
        : false,
  })
  return { ...query, verifyAgain: () => setCycle((value) => value + 1) }
}
