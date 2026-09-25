import { paymentLabels } from './paymentLabels'
export function PaymentBadge({ status }: { status?: string | null }) {
  const value = status ?? 'UNRECORDED'
  const color = ['APPROVED', 'COMPLETED'].includes(value)
    ? 'bg-emerald-50 text-emerald-900'
    : ['FAILED', 'DECLINED', 'ERROR'].includes(value)
      ? 'bg-red-50 text-red-900'
      : 'bg-slate-100 text-slate-800'
  return (
    <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${color}`}>
      {paymentLabels[value] ?? value}
    </span>
  )
}
