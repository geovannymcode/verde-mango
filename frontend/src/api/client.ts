import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { env } from '@/lib/env'
import { refreshTokenStorage } from '@/lib/storage'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import type { ApiErrorBody, ApiResponse } from './types'
import { ApiError } from './types'
import type { components } from './openapi.gen.d.ts'

// En dev usamos baseURL relativo para que el proxy de Vite (/api -> localhost:8080) evite CORS.
// En build de producción usamos la URL absoluta configurada por variable de entorno.
const baseURL = import.meta.env.DEV ? '' : env.apiBaseUrl

export const httpClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

httpClient.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
  }

  // El carrito de invitado se identifica con el header X-Session-Id (confirmado en
  // CartController.kt). Solo se envía cuando no hay sesión iniciada: si el usuario está
  // autenticado, el backend identifica el carrito por el token y no necesita el header.
  if (!accessToken && config.url?.includes('/api/v1/cart')) {
    const sessionId = useCartStore.getState().ensureGuestSessionId()
    config.headers.set('X-Session-Id', sessionId)
  }

  return config
})

httpClient.interceptors.response.use((response) => {
  const sessionId = response.headers['x-session-id']
  if (typeof sessionId === 'string' && sessionId.trim().length > 0) {
    const cartStore = useCartStore.getState()
    if (sessionId !== cartStore.guestSessionId) {
      cartStore.setGuestSessionId(sessionId)
    }
  }
  return response
})

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

let isRefreshing = false
let pendingQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

function resolveQueue(token: string): void {
  pendingQueue.forEach(({ resolve }) => resolve(token))
  pendingQueue = []
}

function rejectQueue(error: unknown): void {
  pendingQueue.forEach(({ reject }) => reject(error))
  pendingQueue = []
}

async function requestFreshTokens(): Promise<string> {
  const refreshToken = refreshTokenStorage.get()
  if (!refreshToken) {
    throw new ApiError('No hay sesión activa')
  }

  type TokenResponse = components['schemas']['TokenResponse']
  const response = await axios.post<ApiResponse<TokenResponse>>(
    `${baseURL}/api/v1/auth/refresh`,
    { refreshToken },
    { headers: { 'Content-Type': 'application/json' } },
  )

  const tokens = unwrap(response)
  // El refresh ROTA el refresh token (AuthService.refreshToken revoca el anterior y crea uno
  // nuevo), así que hay que persistir el que viene en la respuesta, no reusar el viejo.
  // `updateTokens` no toca `user`, a diferencia de `setSession`.
  useAuthStore.getState().updateTokens(tokens.accessToken, tokens.refreshToken)
  return tokens.accessToken
}

// StrictMode/bootstrap and 401 retries share one refresh per tab. Web Locks serialize
// token rotation across tabs; read localStorage inside the lock to use the newest token.
let refreshPromise: Promise<string> | undefined
export function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    const request =
      typeof navigator !== 'undefined' && navigator.locks
        ? navigator.locks.request('vm-refresh-session', requestFreshTokens)
        : requestFreshTokens()
    refreshPromise = Promise.resolve(request).finally(() => {
      refreshPromise = undefined
    })
  }
  return refreshPromise
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const originalRequest = error.config as RetriableConfig | undefined
    const status = error.response?.status
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register') ||
      originalRequest?.url?.includes('/auth/refresh')

    if (status !== 401 || !originalRequest || originalRequest._retry || isAuthEndpoint) {
      return Promise.reject(toApiError(error))
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        pendingQueue.push({ resolve, reject })
      }).then((token) => {
        originalRequest._retry = true
        originalRequest.headers.set('Authorization', `Bearer ${token}`)
        return httpClient(originalRequest)
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const newToken = await refreshAccessToken()
      resolveQueue(newToken)
      originalRequest.headers.set('Authorization', `Bearer ${newToken}`)
      return httpClient(originalRequest)
    } catch (refreshError) {
      rejectQueue(refreshError)
      useAuthStore.getState().clearSession()
      if (typeof window !== 'undefined') {
        const returnTo = window.location.pathname + window.location.search
        window.location.href = `/login?returnTo=${encodeURIComponent(returnTo)}`
      }
      return Promise.reject(toApiError(error))
    } finally {
      isRefreshing = false
    }
  },
)

function toApiError(error: AxiosError<ApiErrorBody>): ApiError {
  const body = error.response?.data
  return new ApiError(body?.message ?? error.message ?? 'Error de red', {
    status: error.response?.status,
    errorCode: body?.errorCode,
    fieldErrors: body?.errors,
  })
}

export function unwrap<T>(response: AxiosResponse<ApiResponse<T>>): T {
  if (!response.data.success) {
    throw new ApiError(response.data.message ?? 'Error en la respuesta del servidor')
  }
  return response.data.data
}
