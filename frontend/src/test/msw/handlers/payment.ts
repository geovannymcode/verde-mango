import { http, HttpResponse } from 'msw'
import { makeCheckout } from '../factories'
import { apiResponse } from '../responses'
// There is no payment endpoint. Checkout's optional paymentUrl is the integration boundary.
// Default mirrors the current backend (no URL); a flow may override it with a test checkout URL.
export const paymentHandlers = [
  http.post('*/api/v1/checkout', () =>
    HttpResponse.json(apiResponse(makeCheckout()), { status: 201 }),
  ),
]
