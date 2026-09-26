import { setupServer } from 'msw/node'
import { authHandlers } from './handlers/auth'
import { catalogHandlers } from './handlers/catalog'
import { ordersHandlers } from './handlers/orders'
import { paymentHandlers } from './handlers/payment'
import { recipesHandlers } from './handlers/recipes'
export const server = setupServer(
  ...authHandlers,
  ...catalogHandlers,
  ...ordersHandlers,
  ...paymentHandlers,
  ...recipesHandlers,
)
