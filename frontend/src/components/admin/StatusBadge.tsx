import { statusLabels, type AdminStatus } from '@/lib/adminStatus'
export function StatusBadge({ status }: { status: AdminStatus }) {
  return (
    <span className="inline-flex whitespace-nowrap rounded-md border border-vm-line bg-stone-50 px-2 py-1 text-xs font-medium text-vm-ink">
      {statusLabels[status]}
    </span>
  )
}
