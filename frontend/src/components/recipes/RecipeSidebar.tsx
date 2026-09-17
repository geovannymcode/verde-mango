import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useRecipeCategories, useRecipeTags, useRecentRecipes } from '@/features/recipes/hooks'
import { useUrlFilters } from '@/hooks/useUrlFilters'
import { formatRecipeDate } from '@/lib/formatters'
import { RecipeError } from './RecipeQueryState'
import { Skeleton } from '@/components/ui/Skeleton'

export function RecipeSidebar({ filters }: { filters: ReturnType<typeof useUrlFilters> }) {
  const categories = useRecipeCategories()
  const tags = useRecipeTags()
  const recent = useRecentRecipes(4)
  const { searchParams, updateParams } = filters
  return (
    <aside
      className="recipe-sidebar space-y-8 lg:border-l lg:border-vm-line lg:pl-8"
      aria-label="Filtros de recetas"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          filters.submitSearch()
        }}
        className="flex gap-2"
      >
        <input
          aria-label="Buscar recetas"
          value={filters.searchInput}
          onChange={(event) => filters.setSearchInput(event.target.value)}
          placeholder="Buscar recetas…"
          className="min-w-0 flex-1 rounded-vm-md border border-vm-line px-3 py-2"
        />
        <button
          type="submit"
          aria-label="Buscar"
          className="rounded-vm-md bg-vm-green p-3 text-white"
        >
          <Search size={20} />
        </button>
      </form>
      <section>
        <h2 className="mb-4 text-xl font-bold">Categorías</h2>
        {categories.isPending && <Skeleton className="h-28 w-full" />}
        {categories.isError && (
          <RecipeError
            message="No pudimos cargar las categorías."
            retry={() => void categories.refetch()}
          />
        )}
        <ul className="space-y-2">
          <li>
            <button
              onClick={() => updateParams({ categoria: undefined })}
              className={!searchParams.has('categoria') ? 'font-bold text-vm-orange' : ''}
            >
              Todas las categorías
            </button>
          </li>
          {categories.data?.map((category) => (
            <li key={category.id}>
              <button
                aria-pressed={searchParams.get('categoria') === category.slug}
                className={
                  searchParams.get('categoria') === category.slug
                    ? 'font-bold text-vm-orange'
                    : 'hover:text-vm-green'
                }
                onClick={() => updateParams({ categoria: category.slug })}
              >
                {category.name} <span className="text-vm-muted">({category.recipeCount})</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="mb-4 text-xl font-bold">Tags</h2>
        {tags.isPending && <Skeleton className="h-20 w-full" />}
        {tags.isError && (
          <RecipeError message="No pudimos cargar los tags." retry={() => void tags.refetch()} />
        )}
        <div className="flex flex-wrap gap-2">
          {tags.data?.map((tag) => (
            <button
              key={tag.id}
              aria-pressed={searchParams.get('tag') === tag.slug}
              onClick={() =>
                updateParams({ tag: searchParams.get('tag') === tag.slug ? undefined : tag.slug })
              }
              className={`rounded-vm-full border px-3 py-1 text-sm ${searchParams.get('tag') === tag.slug ? 'border-vm-green bg-vm-green text-white' : 'border-vm-line hover:bg-vm-cream'}`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </section>
      <section>
        <label htmlFor="recipe-difficulty" className="mb-3 block text-xl font-bold">
          Dificultad
        </label>
        <select
          id="recipe-difficulty"
          value={searchParams.get('dificultad') ?? ''}
          onChange={(event) => updateParams({ dificultad: event.target.value || undefined })}
          className="w-full rounded-vm-md border border-vm-line p-3"
        >
          <option value="">Todas</option>
          <option value="EASY">Fácil</option>
          <option value="MEDIUM">Media</option>
          <option value="HARD">Difícil</option>
        </select>
      </section>
      <section>
        <h2 className="mb-4 text-xl font-bold">Recetas recientes</h2>
        {recent.isPending && <Skeleton className="h-48 w-full" />}
        {recent.isError && <RecipeError retry={() => void recent.refetch()} />}
        {recent.data?.length === 0 && (
          <p className="text-vm-muted">Aún no hay recetas publicadas.</p>
        )}
        <div className="space-y-4">
          {recent.data?.map((recipe) => (
            <Link
              key={recipe.id}
              to={`/recetas/${encodeURIComponent(recipe.slug)}`}
              className="flex gap-3"
            >
              <img
                src={recipe.primaryImageUrl || '/placeholder-product.svg'}
                alt=""
                loading="lazy"
                className="aspect-square h-16 w-16 rounded-vm-md object-cover"
              />
              <div>
                <h3 className="font-bold hover:text-vm-orange">{recipe.title}</h3>
                {recipe.publishedAt && (
                  <time className="text-xs text-vm-muted" dateTime={recipe.publishedAt}>
                    {formatRecipeDate(recipe.publishedAt)}
                  </time>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </aside>
  )
}
