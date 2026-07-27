const REFRESH_TOKEN_KEY = 'vm.refreshToken'
const CART_SESSION_ID_KEY = 'vm.cartSessionId'

export const refreshTokenStorage = {
  get(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },
  set(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token)
  },
  clear(): void {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}

export const cartSessionStorage = {
  get(): string | null {
    return localStorage.getItem(CART_SESSION_ID_KEY)
  },
  set(sessionId: string): void {
    localStorage.setItem(CART_SESSION_ID_KEY, sessionId)
  },
  clear(): void {
    localStorage.removeItem(CART_SESSION_ID_KEY)
  },
}
