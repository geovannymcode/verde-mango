import { LayoutGrid, List } from 'lucide-react'
import { Select } from '@/components/ui/Select'

export type CatalogSortOption =
  | 'predeterminado'
  | 'precio-asc'
  | 'precio-desc'
  | 'recientes'
  | 'calificados'

export type CatalogViewMode = 'grid' | 'list'

interface CatalogToolbarProps {
  resultCount: number
  sort: CatalogSortOption
  onSortChange: (sort: CatalogSortOption) => void
  viewMode: CatalogViewMode
  onViewModeChange: (mode: CatalogViewMode) => void
}

const SORT_LABELS: Record<CatalogSortOption, string> = {
  predeterminado: 'Predeterminado',
  'precio-asc': 'Precio: menor a mayor',
  'precio-desc': 'Precio: mayor a menor',
  recientes: 'Más recientes',
  calificados: 'Mejor calificados',
}

export function CatalogToolbar({
  resultCount,
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
}: CatalogToolbarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-vm-line pb-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-vm-muted">
        Mostrando {resultCount === 1 ? 'el 1 resultado' : `los ${resultCount} resultados`}
      </p>
      <div className="flex items-center gap-3">
        <Select
          aria-label="Ordenar por"
          value={sort}
          onChange={(event) => onSortChange(event.target.value as CatalogSortOption)}
          className="min-w-[200px]"
        >
          {Object.entries(SORT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <div className="flex items-center gap-1 rounded-vm-md border border-vm-line p-1">
          <button
            type="button"
            aria-label="Vista de cuadrícula"
            aria-pressed={viewMode === 'grid'}
            onClick={() => onViewModeChange('grid')}
            className={`flex h-8 w-8 items-center justify-center rounded-vm-sm ${
              viewMode === 'grid' ? 'bg-vm-orange text-vm-white' : 'text-vm-muted hover:bg-vm-cream'
            }`}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            type="button"
            aria-label="Vista de lista"
            aria-pressed={viewMode === 'list'}
            onClick={() => onViewModeChange('list')}
            className={`flex h-8 w-8 items-center justify-center rounded-vm-sm ${
              viewMode === 'list' ? 'bg-vm-orange text-vm-white' : 'text-vm-muted hover:bg-vm-cream'
            }`}
          >
            <List size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
