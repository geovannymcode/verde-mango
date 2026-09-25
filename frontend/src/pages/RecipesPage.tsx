import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useRecipes } from '@/features/recipes/hooks'
import { useUrlFilters } from '@/hooks/useUrlFilters'
import { SectionTitle } from '@/components/layout/SectionTitle'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Pagination } from '@/components/ui/Pagination'
import { Button } from '@/components/ui/Button'
import { RecipeCard } from '@/components/recipes/RecipeCard'
import { RecipeSidebar } from '@/components/recipes/RecipeSidebar'
import { RecipeError, RecipeSkeleton } from '@/components/recipes/RecipeQueryState'
export function RecipesPage() {
  useDocumentTitle(
    'Recetas',
    'Encuentra recetas vegetales por categoría, dificultad e ingredientes para cocinar con Verde Mango.',
  )
  const filters = useUrlFilters()
  const category = filters.searchParams.get('categoria') || undefined
  const tag = filters.searchParams.get('tag') || undefined
  const rawDifficulty = filters.searchParams.get('dificultad')
  const difficulty =
    rawDifficulty === 'EASY' || rawDifficulty === 'MEDIUM' || rawDifficulty === 'HARD'
      ? rawDifficulty
      : undefined
  const recipes = useRecipes({
    search: filters.q || undefined,
    category,
    tag,
    difficulty,
    page: filters.page - 1,
    size: 6,
  })
  const combined = [filters.q, category, tag, difficulty].filter(Boolean).length > 1
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Breadcrumbs items={[{ label: 'Inicio', to: '/' }, { label: 'Recetas' }]} className="mb-4" />
      <SectionTitle
        eyebrow="recetas"
        title="Cocina con Verde Mango"
        description="Ideas para disfrutar los ingredientes de la huerta."
      />
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-8" aria-busy={recipes.isFetching}>
          {combined && (
            <p role="status" className="rounded-vm-md bg-vm-cream p-4 text-sm">
              La búsqueda todavía aplica un filtro a la vez: primero texto, luego categoría, tag y
              dificultad. Los filtros seleccionados se conservan en la URL.
            </p>
          )}
          {recipes.isPending && <RecipeSkeleton />}
          {recipes.isError && <RecipeError retry={() => void recipes.refetch()} />}
          {!recipes.isPending && !recipes.isError && recipes.data?.content.length === 0 && (
            <div className="space-y-4 rounded-vm-lg bg-vm-cream p-8">
              <p>No encontramos recetas con esos filtros.</p>
              <Button variant="outline" onClick={filters.clearFilters}>
                Limpiar filtros
              </Button>
            </div>
          )}
          {!recipes.isError &&
            recipes.data?.content.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} large />
            ))}
          {!recipes.isError && (
            <Pagination
              page={filters.page}
              totalPages={recipes.data?.totalPages ?? 0}
              onPageChange={(page) => filters.updateParams({ page: String(page) }, false)}
            />
          )}
        </div>
        <RecipeSidebar filters={filters} />
      </div>
    </div>
  )
}
