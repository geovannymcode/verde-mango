/// <reference types="node" />
import { mkdirSync, writeFileSync } from 'node:fs'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterAll, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { router as appRouter } from '@/routes'
import { useAuthStore } from '@/store/authStore'
import { makeUser } from './msw/factories'
import { server } from './msw/server'
import { apiResponse } from './msw/responses'
import { auditData } from './a11y/data'
import { createTestQueryClient } from './state'

// Count render-time useForm calls, not Profiler subtree commits (Controller may commit alone).
// Delegate every hook invocation to real RHF; no instrumentation in production files.
const counter = vi.hoisted(() => ({ renders: 0 }))
vi.mock('react-hook-form', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-hook-form')>()
  return {
    ...actual,
    useForm: (...args: Parameters<typeof actual.useForm>) => {
      counter.renders += 1
      return actual.useForm(...args)
    },
  }
})
const measurements: Array<{ page: string; sample: number; perKey: number[] }> = []
it.each([
  { page: '/checkout', field: 'Nombre del destinatario' },
  { page: '/admin/productos/1/editar', field: 'Nombre' },
  { page: '/admin/recetas/1/editar', field: 'Título' },
])('$page: cuenta renders del formulario al escribir diez caracteres', async ({ page, field }) => {
  useAuthStore.getState().setSession('test', 'test', makeUser({ role: 'SUPER_ADMIN' }))
  server.use(
    http.all('*/api/v1/*', ({ request }) =>
      HttpResponse.json(apiResponse(auditData(new URL(request.url).pathname))),
    ),
  )
  const client = createTestQueryClient()
  const router = createMemoryRouter(appRouter.routes, { initialEntries: [page] })
  const view = render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  const input = await screen.findByLabelText(field)
  await waitFor(() => expect(client.isFetching()).toBe(0))
  const user = userEvent.setup()
  await user.click(input)
  for (const sample of [1, 2]) {
    const perKey: number[] = []
    for (const character of 'abcdefghij') {
      const before = counter.renders
      await user.keyboard(character)
      perKey.push(counter.renders - before)
    }
    measurements.push({ page, sample, perKey })
    // Checkout has uncontrolled fields and no watch subscription; typing must not render its owner.
    if (page === '/checkout') expect(perKey).toEqual(Array<number>(10).fill(0))
    // Dirty-state subscriptions may render admin forms once when the first edit marks them dirty.
    else expect(perKey.reduce((sum, value) => sum + value, 0)).toBeLessThanOrEqual(1)
  }
  view.unmount()
  router.dispose()
})
afterAll(() => {
  mkdirSync('coverage/performance', { recursive: true })
  writeFileSync('coverage/performance/form-renders.json', JSON.stringify(measurements, null, 2))
})
