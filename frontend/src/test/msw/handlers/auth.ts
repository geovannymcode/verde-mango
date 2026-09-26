import { http, HttpResponse } from 'msw'
import { makeAuth, makeTokens, makeUser } from '../factories'
import { apiResponse } from '../responses'
export const authHandlers = [
  http.post('*/api/v1/auth/login', () => HttpResponse.json(apiResponse(makeAuth()))),
  http.post('*/api/v1/auth/register', () =>
    HttpResponse.json(apiResponse(makeAuth()), { status: 201 }),
  ),
  http.post('*/api/v1/auth/refresh', () =>
    HttpResponse.json(
      apiResponse(
        makeTokens({ accessToken: 'test-refreshed-access', refreshToken: 'test-rotated-refresh' }),
      ),
    ),
  ),
  http.get('*/api/v1/auth/me', () => HttpResponse.json(apiResponse(makeUser()))),
  http.post('*/api/v1/auth/logout', () => HttpResponse.json(apiResponse(null))),
]
