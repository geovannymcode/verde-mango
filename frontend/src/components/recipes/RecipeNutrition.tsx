import type { NutritionResponse } from '@/api/schema'
const fields = [
  ['calories', 'Calorías', 'kcal'],
  ['proteinGrams', 'Proteínas', 'g'],
  ['carbsGrams', 'Carbohidratos', 'g'],
  ['fatGrams', 'Grasas', 'g'],
  ['fiberGrams', 'Fibra', 'g'],
] as const
export function RecipeNutrition({ nutrition }: { nutrition?: NutritionResponse | null }) {
  if (!nutrition || !fields.some(([key]) => nutrition[key] != null)) return null
  return (
    <section>
      <h2 className="mb-5 text-2xl font-bold">Información nutricional</h2>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {fields.map(
          ([key, label, unit]) =>
            nutrition[key] != null && (
              <div key={key} className="rounded-vm-lg bg-vm-cream p-4">
                <dt className="text-sm text-vm-muted">{label}</dt>
                <dd className="mt-2 text-xl font-bold">
                  {nutrition[key]} {unit}
                </dd>
              </div>
            ),
        )}
      </dl>
    </section>
  )
}
