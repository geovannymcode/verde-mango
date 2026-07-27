import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { useCategories, useProducts } from '@/features/catalog/hooks'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { productListToCard } from '@/lib/adapters'
import { CATALOG_SORT_MAP } from '@/lib/catalogSort'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { SectionTitle } from '@/components/layout/SectionTitle'
import { CatalogSidebar } from '@/components/catalog/CatalogSidebar'
import {
  CatalogToolbar,
  type CatalogSortOption,
  type CatalogViewMode,
} from '@/components/catalog/CatalogToolbar'
import { ProductGrid } from '@/components/catalog/ProductGrid'
import { ProductListItem } from '@/components/catalog/ProductListItem'
import { ProductGridSkeleton } from '@/components/catalog/ProductGridSkeleton'
import { Pagination } from '@/components/ui/Pagination'
import { Button } from '@/components/ui/Button'

const PAGE_SIZE = 12
const DEFAULT_MIN_PRICE = 0
const DEFAULT_MAX_PRICE = 100_000

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [viewMode, setViewMode] = useState<CatalogViewMode>('grid')

  const categoria = searchParams.get('categoria') ?? undefined
  const minPrecio = searchParams.has('minPrecio')
    ? Number(searchParams.get('minPrecio'))
    : DEFAULT_MIN_PRICE
  const maxPrecio = searchParams.has('maxPrecio')
    ? Number(searchParams.get('maxPrecio'))
    : DEFAULT_MAX_PRICE
  const q = searchParams.get('q') ?? ''
  const orden = (searchParams.get('orden') as CatalogSortOption | null) ?? 'predeterminado'
  const page = Number(searchParams.get('page') ?? '1')

  const [searchInput, setSearchInput] = useState(q)
  const debouncedSearch = useDebouncedValue(searchInput, 400)

  useEffect(() => {
    setSearchInput(q)
  }, [q])

  useEffect(() => {
    if (debouncedSearch !== q) {
      updateParams({ q: debouncedSearch || undefined })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  function updateParams(updates: Record<string, string | undefined>, resetPage = true) {
    const next = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        next.delete(key)
      } else {
        next.set(key, value)
      }
    })
    if (resetPage) next.delete('page')
    setSearchParams(next)
  }

  function handleClearFilters() {
    setSearchParams({})
    setSearchInput('')
  }

  const { sortBy, sortDir } = CATALOG_SORT_MAP[orden] ?? CATALOG_SORT_MAP.predeterminado

  const categoriesQuery = useCategories()

  const productsQuery = useProducts({
    category: categoria,
    minPrice: searchParams.has('minPrecio') ? minPrecio : undefined,
    maxPrice: searchParams.has('maxPrecio') ? maxPrecio : undefined,
    search: q || undefined,
    page: Math.max(page - 1, 0),
    size: PAGE_SIZE,
    sortBy,
    sortDir,
  })

  const recentProductsQuery = useProducts({
    sortBy: 'newest',
    sortDir: 'desc',
    page: 0,
    size: 4,
  })

  const products = (productsQuery.data?.content ?? []).map(productListToCard)
  const recentProducts = (recentProductsQuery.data?.content ?? []).map(productListToCard)
  const totalPages = productsQuery.data?.totalPages ?? 0
  const totalElements = productsQuery.data?.totalElements ?? 0
  const hasActiveFilters = !!categoria || searchParams.has('minPrecio') || searchParams.has('maxPrecio') || !!q

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Breadcrumbs items={[{ label: 'Inicio', to: '/' }, { label: 'Tienda' }]} className="mb-4" />
      <SectionTitle eyebrow="tienda" title="Todos nuestros productos" />

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <CatalogSidebar
          categories={categoriesQuery.data ?? []}
          categoriesLoading={categoriesQuery.isLoading}
          activeCategory={categoria}
          onCategorySelect={(slug) => updateParams({ categoria: slug })}
          priceMin={minPrecio}
          priceMax={maxPrecio}
          onPriceApply={(min, max) =>
            updateParams({
              minPrecio: min > DEFAULT_MIN_PRICE ? String(min) : undefined,
              maxPrecio: max < DEFAULT_MAX_PRICE ? String(max) : undefined,
            })
          }
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          recentProducts={recentProducts}
        />

        <div className="flex flex-col gap-6">
          <CatalogToolbar
            resultCount={totalElements}
            sort={orden}
            onSortChange={(value) => updateParams({ orden: value })}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {productsQuery.isLoading && (
            <ProductGridSkeleton columns={viewMode === 'list' ? '1-2-3' : '1-2-3'} count={9} />
          )}

          {productsQuery.isError && !productsQuery.isLoading && (
            <div className="flex flex-col items-center gap-3 rounded-vm-lg border border-vm-line bg-vm-cream py-16 text-center">
              <p className="text-vm-ink">No pudimos cargar los productos.</p>
              <Button variant="outline" size="sm" onClick={() => productsQuery.refetch()}>
                <RefreshCw size={16} />
                Reintentar
              </Button>
            </div>
          )}

          {!productsQuery.isLoading && !productsQuery.isError && products.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-vm-lg border border-vm-line bg-vm-cream py-16 text-center">
              <p className="text-vm-ink">No encontramos productos con esos filtros.</p>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={handleClearFilters}>
                  Limpiar filtros
                </Button>
              )}
            </div>
          )}

          {!productsQuery.isLoading && !productsQuery.isError && products.length > 0 && (
            <>
              {viewMode === 'grid' ? (
                <ProductGrid products={products} columns="1-2-3" />
              ) : (
                <div className="flex flex-col gap-4">
                  {products.map((product) => (
                    <ProductListItem key={product.id} product={product} />
                  ))}
                </div>
              )}

              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={(newPage) => updateParams({ page: String(newPage) }, false)}
                className="mt-4"
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
