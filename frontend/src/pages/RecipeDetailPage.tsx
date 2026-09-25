import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Clock, CookingPot, Users, ChefHat, Share2 } from 'lucide-react'
import { useRecipe, useRelatedRecipes } from '@/features/recipes/hooks'
import type { RecipeResponse } from '@/api/schema'
import { ApiError } from '@/api/types'
import { formatRecipeDate } from '@/lib/formatters'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { IngredientList } from '@/components/recipes/IngredientList'
import { StepList } from '@/components/recipes/StepList'
import { RecipeNutrition } from '@/components/recipes/RecipeNutrition'
import { RecipeRatings } from '@/components/recipes/RecipeRatings'
import { RecipeProducts } from '@/components/recipes/RecipeProducts'
import { RecipeCard } from '@/components/recipes/RecipeCard'
import { RecipeError, RecipeSkeleton } from '@/components/recipes/RecipeQueryState'

function RecipeDetail({ recipe }: { recipe: RecipeResponse }) {
  const related = useRelatedRecipes(recipe.slug)
  const [shareStatus, setShareStatus] = useState('')
  async function share() {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: recipe.title, url })
        setShareStatus('Receta compartida.')
        return
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setShareStatus('Enlace copiado al portapapeles.')
    } catch {
      setShareStatus('No pudimos copiar el enlace. Puedes copiar la dirección de esta página.')
    }
  }
  const category = recipe.category
  const date = recipe.publishedAt ?? recipe.createdAt
  return (
    <article className="recipe-detail mx-auto max-w-5xl space-y-10 px-4 py-10 sm:px-6">
      <div className="recipe-no-print space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Inicio', to: '/' },
            { label: 'Recetas', to: '/recetas' },
            ...(category
              ? [
                  {
                    label: category.name,
                    to: `/recetas?categoria=${encodeURIComponent(category.slug)}`,
                  },
                ]
              : []),
            { label: recipe.title },
          ]}
          className="flex-wrap"
        />
        <img
          src={recipe.primaryImageUrl || '/placeholder-product.svg'}
          alt={recipe.title}
          fetchPriority="high"
          className="aspect-[16/9] w-full rounded-vm-lg object-cover"
        />
        {category && (
          <Badge variant="orange" className="!lowercase">
            {category.name}
          </Badge>
        )}
        <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">{recipe.title}</h1>
        <p className="text-sm text-vm-muted">
          <time dateTime={date}>{formatRecipeDate(date)}</time>
          {recipe.authorName && ` · Por ${recipe.authorName}`}
        </p>
        <div className="flex flex-wrap gap-5 text-sm">
          <span className="flex items-center gap-2">
            <Clock size={20} />
            Preparación: {recipe.prepTime} min
          </span>
          <span className="flex items-center gap-2">
            <CookingPot size={20} />
            Cocción: {recipe.cookTime} min
          </span>
          <span className="flex items-center gap-2">
            <Users size={20} />
            {recipe.servings} {recipe.servingsUnit}
          </span>
          <span className="flex items-center gap-2">
            <ChefHat size={20} />
            {recipe.difficultyLabel}
          </span>
        </div>
        <p className="max-w-[70ch] whitespace-pre-line text-lg leading-relaxed text-vm-muted">
          {recipe.description}
        </p>
        {recipe.introduction && (
          <p className="max-w-[70ch] whitespace-pre-line text-lg leading-relaxed">
            {recipe.introduction}
          </p>
        )}
        <Button variant="outline" onClick={() => void share()}>
          <Share2 size={18} />
          Compartir receta
        </Button>
        <p role="status" className="text-sm text-vm-green">
          {shareStatus}
        </p>
      </div>
      <IngredientList ingredients={recipe.ingredients} />
      <StepList steps={recipe.steps} />
      <div className="recipe-no-print space-y-10">
        {recipe.tips && (
          <section>
            <h2 className="mb-3 text-2xl font-bold">Consejos</h2>
            <p className="max-w-[70ch] whitespace-pre-line leading-relaxed">{recipe.tips}</p>
          </section>
        )}
        <RecipeNutrition nutrition={recipe.nutrition} />
        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {recipe.tags.map((tag) => (
              <Link
                key={tag.id}
                to={`/recetas?tag=${encodeURIComponent(tag.slug)}`}
                className="rounded-vm-full bg-vm-cream px-4 py-2 text-sm text-vm-green"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}
        <RecipeProducts ingredients={recipe.ingredients} />
        <RecipeRatings
          slug={recipe.slug}
          average={recipe.ratingAverage}
          count={recipe.ratingCount}
        />
        {related.isPending && <RecipeSkeleton count={1} />}
        {related.isError && (
          <RecipeError
            message="No pudimos cargar las recetas relacionadas."
            retry={() => void related.refetch()}
          />
        )}
        {!!related.data?.length && (
          <section>
            <h2 className="mb-5 text-2xl font-bold">También te puede gustar</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {related.data.map((item) => (
                <RecipeCard key={item.id} recipe={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  )
}
export function RecipeDetailPage() {
  const { slug } = useParams()
  const query = useRecipe(slug)
  useDocumentTitle(
    query.data?.title ?? 'Receta',
    query.data?.description ??
      'Ingredientes y preparación paso a paso de las recetas de Verde Mango.',
  )
  if (query.isPending)
    return (
      <div className="mx-auto max-w-5xl p-8">
        <RecipeSkeleton count={1} />
      </div>
    )
  if (query.isError) {
    if (query.error instanceof ApiError && query.error.status === 404)
      return (
        <div className="mx-auto max-w-5xl space-y-5 px-4 py-20">
          <h1 className="text-3xl font-bold">Receta no encontrada</h1>
          <p>Esta receta no existe o ya no está publicada.</p>
          <Link to="/recetas" className="font-bold text-vm-green underline">
            Volver a las recetas
          </Link>
        </div>
      )
    return (
      <div className="mx-auto max-w-5xl p-8">
        <RecipeError retry={() => void query.refetch()} />
      </div>
    )
  }
  return <RecipeDetail key={query.data.slug} recipe={query.data} />
}
