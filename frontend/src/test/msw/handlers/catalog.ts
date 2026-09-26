import { http, HttpResponse } from 'msw'
import { makeCategory, makeProduct, makeProductListItem } from '../factories'
import { apiResponse, pageResponse } from '../responses'
export const catalogHandlers = [
  http.get('*/api/v1/categories', () => HttpResponse.json(apiResponse([makeCategory()]))),
  http.get('*/api/v1/products', () =>
    HttpResponse.json(apiResponse(pageResponse([makeProductListItem()]))),
  ),
  http.get('*/api/v1/products/featured', () =>
    HttpResponse.json(apiResponse([makeProductListItem()])),
  ),
  http.get('*/api/v1/products/:id/related', () => HttpResponse.json(apiResponse([]))),
  http.get('*/api/v1/products/id/:id', () => HttpResponse.json(apiResponse(makeProduct()))),
  http.get('*/api/v1/products/:slug', () => HttpResponse.json(apiResponse(makeProduct()))),
]
