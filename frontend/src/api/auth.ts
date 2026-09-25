import { httpClient, unwrap } from './client'
import type { AuthResponse, LoginRequest, RegisterRequest, UserResponse } from './schema'
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
