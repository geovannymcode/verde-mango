import { Link } from 'react-router-dom'
import type { RecipeListResponse } from '@/api/schema'
import { Badge } from '@/components/ui/Badge'
import { formatRecipeDate } from '@/lib/formatters'

export function RecipeCard({
  recipe,
  large = false,
}: {
  recipe: RecipeListResponse
  large?: boolean
}) {
  return (
    <Link
      to={`/recetas/${encodeURIComponent(recipe.slug)}`}
      className="group block overflow-hidden rounded-vm-lg border border-vm-line bg-vm-white transition-shadow hover:shadow-vm-card"
    >
      <img
        src={recipe.primaryImageUrl || '/placeholder-product.svg'}
        alt={recipe.title}
        loading="lazy"
        className="aspect-[16/9] w-full object-cover"
      />
      <div className={large ? 'space-y-4 p-6 sm:p-8' : 'space-y-3 p-4'}>
        {recipe.category && (
          <Badge variant="orange" className="!lowercase">
            {recipe.category.name}
          </Badge>
        )}
        <h2
          className={`${large ? 'text-2xl sm:text-3xl' : 'text-xl'} font-extrabold text-vm-ink group-hover:text-vm-orange`}
        >
          {recipe.title}
        </h2>
        <p className="line-clamp-3 leading-relaxed text-vm-muted">{recipe.description}</p>
        {recipe.publishedAt && (
          <time dateTime={recipe.publishedAt} className="block text-sm text-vm-muted">
            {formatRecipeDate(recipe.publishedAt)}
          </time>
        )}
        <span className="inline-block font-semibold text-vm-green">Leer más →</span>
      </div>
    </Link>
  )
}
