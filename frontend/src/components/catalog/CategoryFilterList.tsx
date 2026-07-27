import type { CategorySummary } from '@/api/schema'

interface CategoryFilterListProps {
  categories: CategorySummary[]
  activeSlug?: string
  onSelect: (slug: string | undefined) => void
}

export function CategoryFilterList({
  categories,
  activeSlug,
  onSelect,
}: CategoryFilterListProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-bold uppercase tracking-wide text-vm-ink">Categorías</p>
      <ul className="flex flex-col gap-1">
        <li>
          <button
            type="button"
            onClick={() => onSelect(undefined)}
            className={`w-full rounded-vm-md px-3 py-2 text-left text-sm font-medium transition-colors ${
              !activeSlug ? 'bg-vm-orange/10 text-vm-orange' : 'text-vm-ink hover:bg-vm-cream'
            }`}
          >
            Todas
          </button>
        </li>
        {categories.map((category) => (
          <li key={category.id}>
            <button
              type="button"
              onClick={() => onSelect(category.slug)}
              className={`flex w-full items-center justify-between rounded-vm-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                activeSlug === category.slug
                  ? 'bg-vm-orange/10 text-vm-orange'
                  : 'text-vm-ink hover:bg-vm-cream'
              }`}
            >
              <span>{category.name}</span>
              <span className="text-xs text-vm-muted">({category.productCount})</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
