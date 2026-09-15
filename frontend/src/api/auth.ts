import { httpClient, unwrap } from './client'
import type { AuthResponse, LoginRequest, RegisterRequest, TokenResponse, UserResponse } from './schema'
import type { ApiResponse } from './types'

export async function login(payload: LoginRequest): Promise<AuthResponse> {
  const response = await httpClient.post<ApiResponse<AuthResponse>>('/api/v1/auth/login', payload)
  return unwrap(response)
}

export async function register(payload: RegisterRequest): Promise<AuthResponse> {
  const response = await httpClient.post<ApiResponse<AuthResponse>>(
    '/api/v1/auth/register',
    payload,
  )
  return unwrap(response)
}

// Nota: AuthController.refreshToken (backend) también pasa por aquí conceptualmente, pero en la
// práctica el interceptor de 401 en `@/api/client.ts` usa su propia instancia de axios
// (`refreshAccessToken`) para evitar recursión con los interceptores de `httpClient`. Esta
// función se deja disponible para llamadas explícitas fuera del flujo de interceptores.
export async function refresh(refreshToken: string): Promise<TokenResponse> {
  const response = await httpClient.post<ApiResponse<TokenResponse>>('/api/v1/auth/refresh', {
    refreshToken,
  })
  return unwrap(response)
}

// AuthService.logout(userId) revoca TODOS los refresh tokens del usuario (no solo el de esta
// sesión/dispositivo) — ver docs/api-gaps.md. No requiere body: la sesión se identifica por el
// access token.
export async function logout(): Promise<void> {
  const response = await httpClient.post<ApiResponse<null>>('/api/v1/auth/logout')
  unwrap(response)
}

export async function getCurrentUser(): Promise<UserResponse> {
  const response = await httpClient.get<ApiResponse<UserResponse>>('/api/v1/auth/me')
  return unwrap(response)
}

// Alias semántico de getCurrentUser para el área de cuenta.
export const getProfile = getCurrentUser

export interface UpdateProfilePayload {
  firstName?: string
  lastName?: string
  phone?: string
  avatarUrl?: string
}

// GAP (ver docs/api-gaps.md "Fase 5"): el backend define `UpdateProfileRequest` en
// `auth/web/Dtos.kt` pero ningún controlador lo expone. No existe `PUT`/`PATCH /api/v1/auth/me`
// hoy. Esta función asume esa ruta como el endpoint más probable si el backend llega a
// implementarlo; contra el backend actual siempre responde 404. La UI de `/cuenta` mantiene el
// formulario de perfil deshabilitado y no llama a esta función hasta que el endpoint exista.
export async function updateProfile(payload: UpdateProfilePayload): Promise<UserResponse> {
  const response = await httpClient.patch<ApiResponse<UserResponse>>('/api/v1/auth/me', payload)
  return unwrap(response)
}
