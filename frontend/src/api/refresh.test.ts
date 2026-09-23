import axios from 'axios'
import { afterEach, expect, it, vi } from 'vitest'
import { refreshAccessToken } from './client'
import { useAuthStore } from '@/store/authStore'
import { refreshTokenStorage } from '@/lib/storage'
afterEach(() => { vi.restoreAllMocks(); useAuthStore.getState().clearSession() })
it('shares concurrent refreshes and waits for the profile before declaring the session ready', async () => {
  useAuthStore.setState({ accessToken: null, user: null, status: 'loading' })
  refreshTokenStorage.set('test-refresh')
  const post = vi.spyOn(axios, 'post').mockResolvedValue({ data: { success: true, data: { accessToken: 'new-access', refreshToken: 'new-refresh' } } })
  const first = refreshAccessToken()
  const second = refreshAccessToken()
  expect(first).toBe(second)
  await first
  expect(post).toHaveBeenCalledTimes(1)
  expect(useAuthStore.getState().status).toBe('loading')
  expect(refreshTokenStorage.get()).toBe('new-refresh')
})
