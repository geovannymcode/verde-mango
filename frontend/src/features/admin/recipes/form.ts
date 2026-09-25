import { z } from 'zod'
import type { CreateRecipe, UpdateRecipe, Recipe } from '@/api/adminRecipes'
import { imageUrlSchema } from '@/api/imageSource'
const optionalUrl = z.union([z.literal(''), imageUrlSchema])
const numericText = z
  .string()
  .refine(
    (v) => v.trim() === '' || (/^\d+(?:[.,]\d{1,2})?$/.test(v) && Number(v.replace(',', '.')) >= 0),
    'Usa un número positivo con hasta dos decimales.',
  )
export const ingredientSchema = z.object({
  name: z.string().trim().min(1, 'Escribe el ingrediente.').max(200),
  quantity: numericText.refine(
    (v) => !v || Number(v.replace(',', '.')) > 0,
    'La cantidad debe ser mayor que cero.',
  ),
  unit: z.string().max(50),
  preparationNotes: z.string().max(200),
  ingredientGroup: z.string().max(100),
  optional: z.boolean(),
  productId: z.number().optional(),
})
export const stepSchema = z.object({
  instruction: z.string().trim().min(1, 'Escribe la descripción del paso.'),
  imageUrl: optionalUrl,
  tip: z.string(),
  estimatedTime: z.number().int().nonnegative().optional(),
})
export const recipeSchema = z
  .object({
    title: z.string().trim().min(1, 'Escribe el título.').max(200),
    slug: z
      .string()
      .min(1, 'Escribe el slug.')
      .max(250)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Usa minúsculas, números y guiones.'),
    description: z.string().trim().min(1, 'Escribe el extracto.'),
    categoryId: z.number().int().positive('Selecciona una categoría.'),
    tagIds: z.array(z.number().int().positive()),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
    prepTime: z.number().int().nonnegative('No puede ser negativo.'),
    cookTime: z.number().int().nonnegative('No puede ser negativo.'),
    servings: z.number().int().positive('Indica al menos una porción.'),
    servingsUnit: z.string(),
    hero: optionalUrl,
    ingredients: z.array(ingredientSchema).min(1, 'Agrega al menos un ingrediente.'),
    steps: z.array(stepSchema).min(1, 'Agrega al menos un paso.'),
    nutritionEnabled: z.boolean(),
    calories: z.string(),
    proteinGrams: z.string(),
    carbsGrams: z.string(),
    fatGrams: z.string(),
    fiberGrams: z.string(),
  })
  .superRefine((value, ctx) => {
    if (value.nutritionEnabled) {
      for (const key of [
        'calories',
        'proteinGrams',
        'carbsGrams',
        'fatGrams',
        'fiberGrams',
      ] as const) {
        if (!numericText.safeParse(value[key]).success)
          ctx.addIssue({
            code: 'custom',
            path: [key],
            message: 'Usa un número no negativo con hasta dos decimales.',
          })
      }
      if (
        !['calories', 'proteinGrams', 'carbsGrams', 'fatGrams', 'fiberGrams'].some(
          (k) => String(value[k as keyof typeof value]).trim() !== '',
        )
      )
        ctx.addIssue({
          code: 'custom',
          path: ['calories'],
          message: 'Completa al menos un dato nutricional.',
        })
      if (value.calories && !Number.isInteger(Number(value.calories.replace(',', '.'))))
        ctx.addIssue({
          code: 'custom',
          path: ['calories'],
          message: 'Las calorías deben ser un entero.',
        })
    }
  })
export type RecipeValues = z.infer<typeof recipeSchema>
export type IngredientValues = z.infer<typeof ingredientSchema>
export const emptyIngredient = (): IngredientValues => ({
  name: '',
  quantity: '',
  unit: '',
  preparationNotes: '',
  ingredientGroup: '',
  optional: false,
})
export const emptyStep = (): z.infer<typeof stepSchema> => ({
  instruction: '',
  imageUrl: '',
  tip: '',
})
const numberOrUndefined = (v: string) => (v.trim() === '' ? undefined : Number(v.replace(',', '.')))
/** The form stores only array order. DTO ordinals are rebuilt for every save. */
export function recipePayload(v: RecipeValues): CreateRecipe & UpdateRecipe {
  return {
    title: v.title,
    slug: v.slug,
    description: v.description,
    categoryId: v.categoryId,
    tagIds: v.tagIds,
    difficulty: v.difficulty,
    prepTime: v.prepTime,
    cookTime: v.cookTime,
    servings: v.servings,
    servingsUnit: v.servingsUnit,
    primaryImageUrl: v.hero,
    steps: v.steps.map((step, index) => ({
      ...step,
      stepNumber: index + 1,
      imageUrl: step.imageUrl || undefined,
      tip: step.tip || undefined,
    })),
    ingredients: v.ingredients.map((item, index) => ({
      ...item,
      quantity: numberOrUndefined(item.quantity),
      unit: item.unit || undefined,
      preparationNotes: item.preparationNotes || undefined,
      ingredientGroup: item.ingredientGroup || undefined,
      displayOrder: index,
    })),
    replaceNutrition: true,
    ...(v.nutritionEnabled
      ? {
          calories: numberOrUndefined(v.calories),
          proteinGrams: numberOrUndefined(v.proteinGrams),
          carbsGrams: numberOrUndefined(v.carbsGrams),
          fatGrams: numberOrUndefined(v.fatGrams),
          fiberGrams: numberOrUndefined(v.fiberGrams),
        }
      : {}),
  }
}
export function recipeDefaults(r?: Recipe): RecipeValues {
  return {
    title: r?.title ?? '',
    slug: r?.slug ?? '',
    description: r?.description ?? '',
    categoryId: r?.category?.id ?? 0,
    tagIds: r?.tags.map((t) => t.id) ?? [],
    difficulty: r?.difficulty ?? 'MEDIUM',
    prepTime: r?.prepTime ?? 0,
    cookTime: r?.cookTime ?? 0,
    servings: r?.servings ?? 4,
    servingsUnit: r?.servingsUnit ?? 'porciones',
    hero: r?.primaryImageUrl ?? '',
    ingredients: r?.ingredients.map((i) => ({
      name: i.name,
      quantity: i.quantity == null ? '' : String(i.quantity),
      unit: i.unit ?? '',
      preparationNotes: i.preparationNotes ?? '',
      ingredientGroup: i.ingredientGroup ?? '',
      optional: i.optional,
      productId: i.productId,
    })) ?? [emptyIngredient()],
    steps: r
      ? [...r.steps]
          .sort((a, b) => a.stepNumber - b.stepNumber)
          .map((s) => ({
            instruction: s.instruction,
            imageUrl: s.imageUrl ?? '',
            tip: s.tip ?? '',
            estimatedTime: s.estimatedTime,
          }))
      : [emptyStep()],
    nutritionEnabled: !!r?.nutrition,
    calories: r?.nutrition?.calories == null ? '' : String(r.nutrition.calories),
    proteinGrams: r?.nutrition?.proteinGrams == null ? '' : String(r.nutrition.proteinGrams),
    carbsGrams: r?.nutrition?.carbsGrams == null ? '' : String(r.nutrition.carbsGrams),
    fatGrams: r?.nutrition?.fatGrams == null ? '' : String(r.nutrition.fatGrams),
    fiberGrams: r?.nutrition?.fiberGrams == null ? '' : String(r.nutrition.fiberGrams),
  }
}
const units = new Set([
  'taza',
  'tazas',
  'cucharada',
  'cucharadas',
  'cucharadita',
  'cucharaditas',
  'g',
  'gr',
  'gramos',
  'kg',
  'kilos',
  'ml',
  'l',
  'litros',
  'unidad',
  'unidades',
  'pizca',
  'pizcas',
  'diente',
  'dientes',
])
/** Conservative parser: unknown units stay in the ingredient name for manual review. */
export function parseIngredients(text: string): IngredientValues[] {
  return text
    .split(/\r?\n/)
    .map((s) => s.trim().replace(/^[-•]\s*/, ''))
    .filter(Boolean)
    .map((line) => {
      const result = emptyIngredient()
      const match = line.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?)\s+(.+)$/)
      if (!match) return { ...result, name: line }
      const pieces = (match[1] ?? '').split(/\s+/)
      let quantity = 0
      for (const piece of pieces) {
        if (piece.includes('/')) {
          const [a, b] = piece.split('/').map(Number)
          if (!b) return { ...result, name: line }
          quantity += (a ?? 0) / b
        } else quantity += Number(piece.replace(',', '.'))
      }
      result.quantity = String(Math.round(quantity * 100) / 100)
      const rest = match[2] ?? line
      const [first = '', ...tail] = rest.split(/\s+/)
      if (units.has(first.toLowerCase())) {
        result.unit = first
        result.name = tail.join(' ').replace(/^de\s+/i, '')
      } else result.name = rest
      return result
    })
}
