import { orderStatuses } from './transitions'
import type { AdminOrderParams } from '@/api/admin'
export function ordersParams(search: URLSearchParams, page: number): AdminOrderParams {
  const statuses = orderStatuses.filter((s) => (search.get('estados') ?? '').split(',').includes(s))
  const date = (value: string | null, end: boolean) =>
    value && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value}T${end ? '23:59:59.999' : '00:00:00'}-05:00`
      : undefined
  return {
    statuses: statuses.length ? statuses : undefined,
    paymentStatus: search.get('pago') || undefined,
    search: search.get('q') || undefined,
    fromDate: date(search.get('desde'), false),
    toDate: date(search.get('hasta'), true),
    page: page - 1,
    size: 20,
    sortBy: search.get('orden') === 'totalAmount' ? 'totalAmount' : 'createdAt',
    sortDir: search.get('direccion') === 'asc' ? 'asc' : 'desc',
  }
}
export function bogotaToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}
