import { waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { expect, it, vi } from 'vitest'
import { httpClient } from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import { refreshTokenStorage } from '@/lib/storage'
import { server } from '../msw/server'
import { apiResponse } from '../msw/responses'
import { makeTokens, makeUser } from '../msw/factories'

function deferred() {
  let release: () => void = () => {
    throw new Error('Barrera sin inicializar')
  }
  const promise = new Promise<void>((resolve) => {
    release = resolve
  })
  return { promise, release }
}
type Sent = { method: string; path: string; authorization: string | null; body: string }
const urls = ['/api/v1/auth/me', '/api/v1/orders/VM-TEST-001', '/api/v1/cart']
const unauthorized = () =>
  HttpResponse.json(
    { success: false, message: 'Token expirado', timestamp: '2026-01-01T12:00:00Z' },
    { status: 401 },
  )
function concurrentScenario(refreshFails = false) {
  useAuthStore.getState().setSession('expired-access', 'stored-refresh', makeUser())
  const initialRequests = deferred(),
    refreshResponse = deferred()
  const requests: Sent[] = [],
    refreshes: Sent[] = []
  server.use(
    ...urls.map((path) =>
      http.get(`*${path}`, async ({ request }) => {
        const sent = {
          method: request.method,
          path: new URL(request.url).pathname,
          authorization: request.headers.get('authorization'),
          body: await request.text(),
        }
        requests.push(sent)
        if (sent.authorization === 'Bearer expired-access') {
          if (requests.filter((r) => r.authorization === 'Bearer expired-access').length === 3)
            initialRequests.release()
          await initialRequests.promise
          return unauthorized()
        }
        return HttpResponse.json(apiResponse({ path: sent.path }))
      }),
    ),
    http.post('*/api/v1/auth/refresh', async ({ request }) => {
      refreshes.push({
        method: request.method,
        path: new URL(request.url).pathname,
        authorization: request.headers.get('authorization'),
        body: await request.text(),
      })
      await refreshResponse.promise
      return refreshFails
        ? unauthorized()
        : HttpResponse.json(
            apiResponse(makeTokens({ accessToken: 'new-access', refreshToken: 'new-refresh' })),
          )
    }),
  )
  return { requests, refreshes, refreshResponse }
}
function expectRefreshRequest(refreshes: Sent[]) {
  expect(refreshes).toHaveLength(1)
  expect(refreshes[0]).toMatchObject({
    method: 'POST',
    path: '/api/v1/auth/refresh',
    authorization: null,
  })
  expect(JSON.parse(refreshes[0]!.body)).toEqual({ refreshToken: 'stored-refresh' })
}
it('tres 401 concurrentes comparten un refresh y reintentan exactamente una vez con el token nuevo', async () => {
  const s = concurrentScenario()
  const resolved = urls.map(() => vi.fn())
  const pending = urls.map((url, index) =>
    httpClient.get(url).then((response) => {
      resolved[index]!(response.data.data)
      return response
    }),
  )
  try {
    await waitFor(() => expect(s.refreshes).toHaveLength(1))
    expect(s.requests).toHaveLength(3)
  } finally {
    s.refreshResponse.release()
  }
  const responses = await Promise.all(pending)
  expectRefreshRequest(s.refreshes)
  expect(s.requests).toHaveLength(6)
  for (const [index, path] of urls.entries()) {
    expect(s.requests.filter((r) => r.path === path)).toEqual([
      { method: 'GET', path, authorization: 'Bearer expired-access', body: '' },
      { method: 'GET', path, authorization: 'Bearer new-access', body: '' },
    ])
    expect(resolved[index]).toHaveBeenCalledExactlyOnceWith({ path })
    expect(responses[index]?.status).toBe(200)
  }
  expect(refreshTokenStorage.get()).toBe('new-refresh')
})
it('refresh fallido rechaza las tres peticiones, limpia sesión y redirige a login con returnTo', async () => {
  // jsdom cannot navigate and Location.href is non-configurable. Observe only that browser
  // boundary through a window proxy; Axios and its real interceptors still run through MSW.
  const realWindow = window
  const navigation = vi.fn()
  const location = {
    pathname: '/cuenta/ordenes',
    search: '?page=2',
    get href() {
      return 'http://localhost/cuenta/ordenes?page=2'
    },
    set href(value: string) {
      navigation(value)
    },
  }
  vi.stubGlobal(
    'window',
    new Proxy(realWindow, {
      get(target, key) {
        return key === 'location' ? location : Reflect.get(target, key, target)
      },
    }),
  )
  const s = concurrentScenario(true)
  const pending = Promise.allSettled(urls.map((url) => httpClient.get(url)))
  try {
    await waitFor(() => expect(s.refreshes).toHaveLength(1))
  } finally {
    s.refreshResponse.release()
  }
  const results = await pending
  expectRefreshRequest(s.refreshes)
  expect(s.requests).toEqual(
    expect.arrayContaining(
      urls.map((path) => ({
        method: 'GET',
        path,
        authorization: 'Bearer expired-access',
        body: '',
      })),
    ),
  )
  expect(s.requests).toHaveLength(3)
  expect(results.map((result) => result.status)).toEqual(['rejected', 'rejected', 'rejected'])
  expect(useAuthStore.getState()).toMatchObject({
    status: 'anonymous',
    user: null,
    accessToken: null,
  })
  expect(refreshTokenStorage.get()).toBeNull()
  expect(navigation).toHaveBeenCalledExactlyOnceWith(
    '/login?returnTo=%2Fcuenta%2Fordenes%3Fpage%3D2',
  )
})
it('un 401 de login no dispara refresh', async () => {
  const refresh = vi.fn(),
    requests: Sent[] = []
  refreshTokenStorage.set('existing-refresh')
  server.use(
    http.post('*/api/v1/auth/login', async ({ request }) => {
      requests.push({
        method: request.method,
        path: new URL(request.url).pathname,
        authorization: request.headers.get('authorization'),
        body: await request.text(),
      })
      return unauthorized()
    }),
    http.post('*/api/v1/auth/refresh', () => {
      refresh()
      return HttpResponse.json(apiResponse(makeTokens()))
    }),
  )
  await expect(
    httpClient.post('/api/v1/auth/login', {
      email: 'cliente@example.test',
      password: 'incorrecta',
    }),
  ).rejects.toMatchObject({ status: 401 })
  expect(refresh).not.toHaveBeenCalled()
  expect(requests).toHaveLength(1)
  expect(requests[0]).toMatchObject({
    method: 'POST',
    path: '/api/v1/auth/login',
    authorization: null,
  })
  expect(JSON.parse(requests[0]!.body)).toEqual({
    email: 'cliente@example.test',
    password: 'incorrecta',
  })
})
