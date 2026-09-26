import { http, HttpResponse } from 'msw'
import { makeCart, makeCheckoutValidation, makeOrder, type Schema } from '../factories'
import { apiResponse, pageResponse } from '../responses'
export const ordersHandlers = [
  http.get('*/api/v1/cart', () => HttpResponse.json(apiResponse(makeCart()))),
  http.post('*/api/v1/cart/merge', () => HttpResponse.json(apiResponse(makeCart()))),
  http.post('*/api/v1/checkout/validate', () =>
    HttpResponse.json(apiResponse(makeCheckoutValidation())),
  ),
  http.get('*/api/v1/orders', () =>
    HttpResponse.json(apiResponse(pageResponse<Schema['OrderListResponse']>([]))),
  ),
  http.get('*/api/v1/orders/:orderNumber', () => HttpResponse.json(apiResponse(makeOrder()))),
  http.get('*/api/v1/admin/orders', () =>
    HttpResponse.json(apiResponse(pageResponse<Schema['OrderListResponse']>([]))),
  ),
  http.get('*/api/v1/admin/orders/:id', () => HttpResponse.json(apiResponse(makeOrder()))),
]
