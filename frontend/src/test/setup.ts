import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest'
import { server } from './msw/server'
import { clearTestQueryClients, resetTestStores } from './state'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => {
  resetTestStores()
  window.history.replaceState(null, '', '/')
})
afterEach(async () => {
  cleanup()
  await clearTestQueryClients()
  server.resetHandlers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.useRealTimers()
  resetTestStores()
})
afterAll(() => server.close())
