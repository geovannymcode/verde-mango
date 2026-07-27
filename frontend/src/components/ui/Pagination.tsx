import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({ page, totalPages, onPageChange, className = '' }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)

  return (
    <nav aria-label="Paginación" className={`flex items-center justify-center gap-1 ${className}`}>
      <button
        type="button"
        aria-label="Página anterior"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="flex h-9 w-9 items-center justify-center rounded-vm-full text-vm-ink hover:bg-vm-cream disabled:opacity-30"
      >
        <ChevronLeft size={18} />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          aria-current={p === page ? 'page' : undefined}
          onClick={() => onPageChange(p)}
          className={`flex h-9 w-9 items-center justify-center rounded-vm-full text-sm font-semibold transition-colors ${
            p === page ? 'bg-vm-orange text-vm-white' : 'text-vm-ink hover:bg-vm-cream'
          }`}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        aria-label="Página siguiente"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="flex h-9 w-9 items-center justify-center rounded-vm-full text-vm-ink hover:bg-vm-cream disabled:opacity-30"
      >
        <ChevronRight size={18} />
      </button>
    </nav>
  )
}
