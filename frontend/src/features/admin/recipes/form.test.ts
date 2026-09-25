import { describe, expect, it } from 'vitest'
import {
  emptyIngredient,
  emptyStep,
  parseIngredients,
  recipeDefaults,
  recipePayload,
  recipeSchema,
} from './form'
const valid = () => ({
  ...recipeDefaults(),
  title: 'Quinua',
  slug: 'quinua',
  description: 'Preparación casera',
  categoryId: 1,
  ingredients: [{ ...emptyIngredient(), name: 'Quinua', quantity: '2', unit: 'tazas' }],
  steps: ['Lavar', 'Cocinar', 'Servir'].map((instruction) => ({ ...emptyStep(), instruction })),
})
describe('Formulario de recetas', () => {
  it('renumera después de reordenar y eliminar el paso del medio', () => {
    const form = valid()
    const [first, second, third] = form.steps
    if (!first || !second || !third) throw new Error('Fixture incompleto')
    form.steps = [third, first, second]
    expect(recipePayload(form).steps.map((s) => [s.stepNumber, s.instruction])).toEqual([
      [1, 'Servir'],
      [2, 'Lavar'],
      [3, 'Cocinar'],
    ])
    form.steps.splice(1, 1)
    expect(recipePayload(form).steps.map((s) => [s.stepNumber, s.instruction])).toEqual([
      [1, 'Servir'],
      [2, 'Cocinar'],
    ])
  })
  it('parsea unidades, fracciones y conserva texto ambiguo para revisión', () => {
    expect(
      parseIngredients(
        '2 tazas de quinua\n1 1/2 cucharadas de aceite\nSal al gusto\n2 paquetes de pasta',
      ).map((i) => [i.quantity, i.unit, i.name]),
    ).toEqual([
      ['2', 'tazas', 'quinua'],
      ['1.5', 'cucharadas', 'aceite'],
      ['', '', 'Sal al gusto'],
      ['2', '', 'paquetes de pasta'],
    ])
  })
  it('valida los arrays y ubica el error en su fila', () => {
    expect(recipeSchema.safeParse(valid()).success).toBe(true)
    const form = valid()
    form.steps[0]!.instruction = ''
    form.ingredients[0]!.quantity = '-1'
    const result = recipeSchema.safeParse(form)
    expect(result.success).toBe(false)
    if (!result.success)
      expect(result.error.issues.map((i) => i.path.join('.'))).toEqual(
        expect.arrayContaining(['steps.0.instruction', 'ingredients.0.quantity']),
      )
    expect(recipeSchema.safeParse({ ...valid(), steps: [], ingredients: [] }).success).toBe(false)
  })
  it('omite toda nutrición al apagar el toggle, incluso valores antiguos inválidos', () => {
    const form = { ...valid(), nutritionEnabled: false, calories: 'inválido', proteinGrams: '12' }
    expect(recipeSchema.safeParse(form).success).toBe(true)
    const payload = recipePayload(form)
    expect(payload.replaceNutrition).toBe(true)
    expect(payload).not.toHaveProperty('calories')
    expect(payload).not.toHaveProperty('proteinGrams')
    expect(recipeSchema.safeParse({ ...form, nutritionEnabled: true }).success).toBe(false)
    expect(
      recipePayload({ ...valid(), nutritionEnabled: true, carbsGrams: '12,5' }).carbsGrams,
    ).toBe(12.5)
  })
  it('calcula el orden de ingredientes desde el array', () => {
    const form = valid()
    form.ingredients.push({ ...emptyIngredient(), name: 'Sal' })
    expect(recipePayload(form).ingredients.map((i) => i.displayOrder)).toEqual([0, 1])
  })
})
