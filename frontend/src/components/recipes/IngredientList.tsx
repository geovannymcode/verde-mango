import { useState } from 'react'
import type { RecipeIngredientResponse } from '@/api/schema'
export function IngredientList({ ingredients }: { ingredients: RecipeIngredientResponse[] }) {
  const [checked, setChecked] = useState<Set<number>>(() => new Set())
  return (
    <section className="recipe-print-section">
      <h2 className="mb-5 text-2xl font-bold">Ingredientes</h2>
      <ul className="space-y-3">
        {ingredients.map((ingredient) => (
          <li key={ingredient.id}>
            <label className="flex cursor-pointer items-start gap-3 rounded-vm-md bg-vm-cream p-3">
              <input
                type="checkbox"
                checked={checked.has(ingredient.id)}
                onChange={() =>
                  setChecked((previous) => {
                    const next = new Set(previous)
                    if (next.has(ingredient.id)) next.delete(ingredient.id)
                    else next.add(ingredient.id)
                    return next
                  })
                }
                className="mt-1 h-4 w-4 accent-vm-green"
              />
              <span
                className={
                  checked.has(ingredient.id)
                    ? 'ingredient-text text-vm-muted line-through'
                    : 'ingredient-text'
                }
              >
                {ingredient.ingredientGroup && (
                  <span className="block text-xs font-bold text-vm-green">
                    {ingredient.ingredientGroup}
                  </span>
                )}
                {ingredient.formatted || ingredient.name}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  )
}
