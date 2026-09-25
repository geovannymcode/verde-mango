import axios from 'axios'
import { afterEach, expect, it, vi } from 'vitest'
import { refreshAccessToken } from './client'
import { useAuthStore } from '@/store/authStore'
import { refreshTokenStorage } from '@/lib/storage'
afterEach(() => {
  vi.restoreAllMocks()
  useAuthStore.getState().clearSession()
})
it('shares concurrent refreshes and waits for the profile before declaring the session ready', async () => {
  useAuthStore.setState({ accessToken: null, user: null, status: 'loading' })
  refreshTokenStorage.set('test-refresh')
  const post = vi.spyOn(axios, 'post').mockResolvedValue({
    data: { success: true, data: { accessToken: 'new-access', refreshToken: 'new-refresh' } },
  })
  const first = refreshAccessToken()
  const second = refreshAccessToken()
  expect(first).toBe(second)
  await first
  expect(post).toHaveBeenCalledTimes(1)
  expect(useAuthStore.getState().status).toBe('loading')
  expect(refreshTokenStorage.get()).toBe('new-refresh')
})

it('returns the access token after acquiring the cross-tab refresh lock', async () => {
  refreshTokenStorage.set('test-refresh')
  vi.spyOn(axios, 'post').mockResolvedValue({
    data: {
      success: true,
      data: { accessToken: 'locked-access', refreshToken: 'rotated-refresh' },
    },
  })
  const request = vi.fn(async (_name: string, callback: () => Promise<string>) => callback())
  Object.defineProperty(navigator, 'locks', { configurable: true, value: { request } })
  try {
    await expect(refreshAccessToken()).resolves.toBe('locked-access')
    expect(request).toHaveBeenCalledWith('vm-refresh-session', expect.any(Function))
  } finally {
    Reflect.deleteProperty(navigator, 'locks')
  }
})
