import { useId, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { adminErrorMessage } from '@/lib/adminErrors'
export interface TableSort<K extends string = string> {
  key: K
  direction: 'asc' | 'desc'
}
export interface DataColumn<T, K extends string = string> {
  id: string
  header: string
  cell: (row: T) => ReactNode
  sortKey?: K
  className?: string
}
interface DataTableProps<T, K extends string> {
  caption: string
  columns: readonly DataColumn<T, K>[]
  rows: readonly T[]
  rowKey: (row: T) => string | number
  pagination: { page: number; size: number; totalElements: number; totalPages: number }
  onPageChange: (page: number) => void
  sort?: TableSort<K>
  onSortChange?: (sort: TableSort<K>) => void
  isLoading?: boolean
  isFetching?: boolean
  error?: unknown
  onRetry?: () => void
  emptyAction?: ReactNode
  rowClassName?: (row: T) => string
  emptyMessage?: string
}
/** Server owns sorting and pagination; this component never sorts or slices the received page. */
export function DataTable<T, K extends string = string>({
  caption,
  columns,
  rows,
  rowKey,
  pagination,
  onPageChange,
  sort,
  onSortChange,
  isLoading,
  isFetching,
  error,
  onRetry,
  emptyAction, rowClassName,
  emptyMessage = 'No hay registros para mostrar.',
}: DataTableProps<T, K>) {
  const id = useId()
  const { page, size, totalElements, totalPages } = pagination
  const busy = isLoading || isFetching
  return (
    <section className="min-w-0 space-y-4" aria-busy={busy}>
      {error != null && (
        <div role="alert" className="rounded-md border border-vm-line p-4">
          <p>{adminErrorMessage(error)}</p>
          {onRetry && (
            <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
              Reintentar
            </Button>
          )}
        </div>
      )}
      <div
        tabIndex={0}
        role="region"
        aria-label={caption}
        className="max-w-full overflow-x-auto rounded-lg border border-vm-line"
      >
        <table className="w-full text-left text-sm">
          <caption id={id} className="sr-only">
            {caption}
          </caption>
          <thead className="border-b border-vm-line bg-stone-50">
            <tr>
              {columns.map((column) => {
                const sortable = column.sortKey !== undefined && onSortChange !== undefined
                const selected = sort?.key === column.sortKey
                return (
                  <th
                    key={column.id}
                    scope="col"
                    className={`whitespace-nowrap px-4 py-3 font-semibold ${column.className ?? ''}`}
                    aria-sort={
                      sortable
                        ? selected
                          ? sort?.direction === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                        : undefined
                    }
                  >
                    {sortable ? (
                      <button
                        type="button"
                        disabled={busy}
                        className="flex items-center gap-2 disabled:opacity-50"
                        onClick={() =>
                          onSortChange({
                            key: column.sortKey!,
                            direction: selected && sort?.direction === 'asc' ? 'desc' : 'asc',
                          })
                        }
                      >
                        {column.header}
                        {selected ? (
                          sort?.direction === 'asc' ? (
                            <ArrowUp size={14} />
                          ) : (
                            <ArrowDown size={14} />
                          )
                        ) : (
                          <ChevronsUpDown size={14} />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center" role="status">
                  <span className="sr-only">Cargando registros…</span>
                  <div className="space-y-4" aria-hidden="true">{[0,1,2,3,4].map(index => <div key={index} className="h-10 animate-pulse rounded bg-stone-100" />)}</div>
                </td>
              </tr>
            ) : error != null ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-vm-muted">
                  Los datos no están disponibles.
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-vm-muted">
                  <p>{emptyMessage}</p>
                  {emptyAction && <div className="mt-4">{emptyAction}</div>}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  className={`border-b border-vm-line last:border-0 hover:bg-stone-50 ${rowClassName?.(row) ?? ''}`}
                >
                  {columns.map((column) => (
                    <td key={column.id} className={`px-4 py-4 ${column.className ?? ''}`}>
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {error == null && !isLoading && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-vm-muted" aria-live="polite">
            {totalElements
              ? `${rows.length ? (page - 1) * size + 1 : 0}–${rows.length ? Math.min((page - 1) * size + rows.length, totalElements) : 0} de ${totalElements}`
              : '0 registros'}
          </p>
          <nav aria-label={`Paginación de ${caption}`} className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              aria-label="Página anterior"
              disabled={busy || page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft size={16} />
            </Button>
            <span>
              Página {page} de {Math.max(1, totalPages)}
            </span>
            <Button
              variant="outline"
              size="sm"
              aria-label="Página siguiente"
              disabled={busy || page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight size={16} />
            </Button>
          </nav>
        </div>
      )}
    </section>
  )
}
