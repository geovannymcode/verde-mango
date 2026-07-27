import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { env } from '@/lib/env'
import { refreshTokenStorage } from '@/lib/storage'
import { useAuthStore } from '@/store/authStore'
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
  return config
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

async function refreshAccessToken(): Promise<string> {
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
  useAuthStore.getState().setSession(tokens.accessToken, tokens.refreshToken)
  return tokens.accessToken
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const originalRequest = error.config as RetriableConfig | undefined
    const status = error.response?.status
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') ||
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
        window.location.href = '/login'
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
