import { Link } from 'react-router-dom'
import { Clock, Users } from 'lucide-react'
import type { RecipeMock } from '@/lib/mocks'

interface RecipeCardProps {
  recipe: RecipeMock
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Link
      to={`/recetas/${recipe.slug}`}
      className="group flex flex-col overflow-hidden rounded-vm-lg border border-vm-line bg-vm-white transition-shadow hover:shadow-vm-card"
    >
      <div className="aspect-[4/3] overflow-hidden bg-vm-cream">
        <img
          src={recipe.image}
          alt={recipe.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-vm-green">
          {recipe.difficulty}
        </span>
        <h3 className="line-clamp-2 font-bold text-vm-ink group-hover:text-vm-orange">
          {recipe.title}
        </h3>
        <p className="line-clamp-2 text-sm text-vm-muted">{recipe.excerpt}</p>
        <div className="mt-auto flex items-center gap-4 pt-2 text-xs text-vm-muted">
          <span className="flex items-center gap-1">
            <Clock size={14} /> {recipe.minutes} min
          </span>
          <span className="flex items-center gap-1">
            <Users size={14} /> {recipe.servings} porciones
          </span>
        </div>
      </div>
    </Link>
  )
}
