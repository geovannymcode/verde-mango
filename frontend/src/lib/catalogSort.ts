import type { ProductSortBy, SortDir } from '@/api/catalog'
import type { CatalogSortOption } from '@/components/catalog/CatalogToolbar'

export const CATALOG_SORT_MAP: Record<
  CatalogSortOption,
  { sortBy: ProductSortBy; sortDir: SortDir }
> = {
  predeterminado: { sortBy: 'newest', sortDir: 'desc' },
  'precio-asc': { sortBy: 'price', sortDir: 'asc' },
  'precio-desc': { sortBy: 'price', sortDir: 'desc' },
  recientes: { sortBy: 'newest', sortDir: 'desc' },
  calificados: { sortBy: 'rating', sortDir: 'desc' },
}
