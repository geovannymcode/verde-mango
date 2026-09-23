import type { OrderResponse } from '@/api/schema'
import { StatusBadge, statusColors } from '@/components/admin/StatusBadge'
import { formatDateTime } from '@/lib/formatters'
export function OrderTimeline({ history, current }: { history: OrderResponse['statusHistory']; current: OrderResponse['status'] }) {
  const entries = [...history].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id)
  return <section aria-label="Historial de estados"><h2 className="mb-5 text-xl font-bold">Historial de estados</h2>
    {entries.length === 0 ? <p>No hay movimientos registrados.</p> : <ol className="ml-2 space-y-6 border-l border-vm-line pl-6">{entries.map((entry, index) => {
      const active = index === entries.length - 1 && entry.toStatus === current
      return <li key={entry.id} aria-current={active ? 'step' : undefined} className={`relative rounded-md p-3 ${active ? 'bg-stone-50 ring-1 ring-vm-line' : ''}`}>
        <span aria-hidden="true" className={`absolute -left-8 top-4 h-4 w-4 rounded-full border ${statusColors[entry.toStatus]}`} />
        <StatusBadge status={entry.toStatus} />{active && <span className="ml-2 text-sm font-semibold">Estado actual</span>}
        <p className="mt-2 text-sm"><time dateTime={entry.createdAt}>{formatDateTime(entry.createdAt)}</time></p>
        <p className="text-sm text-vm-muted">Origen: {entry.changedByType}</p>
        {entry.comment && <p className="mt-2 whitespace-pre-wrap break-words">{entry.comment}</p>}
      </li>
    })}</ol>}
  </section>
}
