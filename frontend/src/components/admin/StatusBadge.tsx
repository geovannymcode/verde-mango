import { statusLabels, statusColors, type AdminStatus } from '@/lib/adminStatus'
export function StatusBadge({ status }: { status: AdminStatus }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-md border px-2 py-1 text-xs font-medium ${statusColors[status]}`}
    >
      {statusLabels[status]}
    </span>
  )
}
