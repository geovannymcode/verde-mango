import { Search } from 'lucide-react'
import type { CategorySummary } from '@/api/schema'
import type { CatalogProductCard } from '@/types/catalog'
import { CategoryFilterList } from '@/components/catalog/CategoryFilterList'
import { PriceRangeFilter } from '@/components/catalog/PriceRangeFilter'
import { RecentProductsList } from '@/components/catalog/RecentProductsList'
import { Skeleton } from '@/components/ui/Skeleton'

interface CatalogSidebarProps {
  categories: CategorySummary[]
  categoriesLoading: boolean
  activeCategory?: string
  onCategorySelect: (slug: string | undefined) => void
  priceMin: number
  priceMax: number
  onPriceApply: (min: number, max: number) => void
  searchValue: string
  onSearchChange: (value: string) => void
  recentProducts: CatalogProductCard[]
}

export function CatalogSidebar({
  categories,
  categoriesLoading,
  activeCategory,
  onCategorySelect,
  priceMin,
  priceMax,
  onPriceApply,
  searchValue,
  onSearchChange,
  recentProducts,
}: CatalogSidebarProps) {
  return (
    <aside className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-bold uppercase tracking-wide text-vm-ink">Buscar</p>
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-vm-muted"
          />
          <input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar productos…"
            aria-label="Buscar productos"
            className="h-11 w-full rounded-vm-md border border-vm-line bg-vm-white pl-9 pr-4 text-sm text-vm-ink placeholder:text-vm-muted focus-visible:border-vm-orange focus-visible:outline-none"
          />
        </div>
      </div>

      {categoriesLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : (
        <CategoryFilterList
          categories={categories}
          activeSlug={activeCategory}
          onSelect={onCategorySelect}
        />
      )}

      <PriceRangeFilter min={priceMin} max={priceMax} onApply={onPriceApply} />

      <RecentProductsList products={recentProducts} />
    </aside>
  )
}
