import { http, HttpResponse } from 'msw'
import { makeRecipe, makeRecipeListItem, type Schema } from '../factories'
import { apiResponse, pageResponse } from '../responses'
export const recipesHandlers = [
  http.get('*/api/v1/recipes', () =>
    HttpResponse.json(apiResponse(pageResponse([makeRecipeListItem()]))),
  ),
  http.get('*/api/v1/recipes/search', () =>
    HttpResponse.json(apiResponse(pageResponse([makeRecipeListItem()]))),
  ),
  http.get('*/api/v1/recipes/latest', () => HttpResponse.json(apiResponse([makeRecipeListItem()]))),
  http.get('*/api/v1/recipes/categories', () =>
    HttpResponse.json(apiResponse<Schema['CategoryResponse'][]>([])),
  ),
  http.get('*/api/v1/recipes/tags', () =>
    HttpResponse.json(apiResponse<Schema['TagResponse'][]>([])),
  ),
  http.get('*/api/v1/recipes/:slug', () => HttpResponse.json(apiResponse(makeRecipe()))),
]
