import { afterEach, describe, expect, it, vi } from 'vitest'
import { httpClient } from './client'
import { getRecipes, getRecipe, getRecipeRatings, createRecipeRating } from './recipes'
const envelope = { data: { success: true, data: { content: [], totalPages: 0 }, message: null } }
afterEach(() => vi.restoreAllMocks())
describe('recipe API contracts', () => {
  it('uses the public listing without filters, search endpoint for combined filters', async () => {
    const get = vi.spyOn(httpClient, 'get').mockResolvedValue(envelope)
    await getRecipes({ page: 1, size: 6 })
    expect(get).toHaveBeenLastCalledWith('/api/v1/recipes', { params: { page: 1, size: 6 } })
    await getRecipes({ search: 'arroz', category: 'almuerzo', tag: 'vegano', difficulty: 'EASY' })
    expect(get).toHaveBeenLastCalledWith('/api/v1/recipes/search', {
      params: {
        search: 'arroz',
        category: 'almuerzo',
        tag: 'vegano',
        difficulty: 'EASY',
        page: 0,
        size: 12,
      },
    })
  })
  it('addresses details and ratings by escaped slug and posts the actual rating DTO', async () => {
    const get = vi.spyOn(httpClient, 'get').mockResolvedValue(envelope)
    const post = vi.spyOn(httpClient, 'post').mockResolvedValue(envelope)
    await getRecipe('sopa especial')
    expect(get).toHaveBeenLastCalledWith('/api/v1/recipes/sopa%20especial', { params: undefined })
    await getRecipeRatings('sopa')
    expect(get).toHaveBeenLastCalledWith('/api/v1/recipes/sopa/ratings', {
      params: { page: 0, size: 10 },
    })
    const dto = { rating: 4, comment: 'Muy rica', madeRecipe: true }
    await createRecipeRating('sopa', dto)
    expect(post).toHaveBeenCalledWith('/api/v1/recipes/sopa/ratings', dto)
  })
})
