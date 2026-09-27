/// <reference types="node" />
import { mkdirSync, writeFileSync } from 'node:fs'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterAll, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import * as matchers from 'vitest-axe/matchers'
import { http, HttpResponse } from 'msw'
import { router as appRouter } from '@/routes'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { useUiStore } from '@/store/uiStore'
import { server } from '../msw/server'
import { apiResponse } from '../msw/responses'
import { makeUser } from '../msw/factories'
import { createTestQueryClient } from '../state'
import { auditData } from './data'
expect.extend(matchers)
const reports: unknown[] = []
const cases = [
  '/',
  '/tienda',
  '/tienda/kimchi-prueba',
  '/carrito',
  '/checkout',
  '/checkout/resultado?reference=VM-TEST-001',
  '/recetas',
  '/recetas/quinua-prueba',
  '/login',
  '/registro',
  '/contactenos',
  '/nosotros',
  '/cuenta/ordenes',
  '/cuenta',
  '/cuenta/ordenes/VM-TEST-001',
  '/admin/ordenes/1',
  '/admin/productos',
  '/admin/categorias',
  '/admin/ordenes',
  '/admin/recetas',
  '/admin',
  '/admin/recetas/1/editar',
  '/admin/productos/1/editar',
  '/checkout?invalid=1',
  '/login?invalid=1',
  '/admin/recetas/nueva?invalid=1',
  '/?overlay=cart',
  '/?overlay=mobile',
  '/admin/productos?overlay=confirm',
]
it.each(cases)('registra axe sin corregir ni ocultar hallazgos: %s', async (entry) => {
  const client = createTestQueryClient()
  server.use(
    http.all('*/api/v1/*', ({ request }) =>
      HttpResponse.json(apiResponse(auditData(new URL(request.url).pathname))),
    ),
  )
  if (entry.startsWith('/login') || entry.startsWith('/registro'))
    useAuthStore.getState().setStatus('anonymous')
  else
    useAuthStore
      .getState()
      .setSession('audit-access', 'audit-refresh', makeUser({ role: 'SUPER_ADMIN' }))
  const router = createMemoryRouter(appRouter.routes, { initialEntries: [entry] })
  const view = render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  await waitFor(() => expect(client.isFetching()).toBe(0))
  const errors = client
    .getQueryCache()
    .getAll()
    .filter((query) => query.state.status === 'error')
  expect(errors.map((query) => query.state.error)).toEqual([])
  if (entry.includes('overlay=cart'))
    fireEvent.click(screen.getByRole('button', { name: 'Abrir carrito' }))
  if (entry.includes('overlay=mobile'))
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }))
  if (entry.includes('overlay=confirm'))
    fireEvent.click(screen.getByRole('button', { name: /Eliminar/ }))
  if (entry.includes('overlay=')) await screen.findByRole('dialog')
  if (entry.includes('invalid=1')) {
    const name = entry.startsWith('/checkout')
      ? 'Pagar con Wompi'
      : entry.startsWith('/login')
        ? 'Iniciar sesión'
        : 'Publicar'
    fireEvent.click(screen.getByRole('button', { name }))
    await waitFor(() =>
      expect(document.querySelector('[aria-invalid="true"], [role="alert"]')).not.toBeNull(),
    )
  }
  // Layout-dependent contrast cannot be evaluated in jsdom: measured separately in the audit.
  const results = await axe(document.body, {
    iframes: false,
    rules: { 'color-contrast': { enabled: false } },
  })
  reports.push({
    entry,
    violations: results.violations.map(({ id, impact, description, helpUrl, nodes }) => ({
      id,
      impact,
      description,
      helpUrl,
      nodes: nodes.map(({ target, html, failureSummary }) => ({ target, html, failureSummary })),
    })),
    incomplete: results.incomplete.map(({ id }) => id),
    headings: Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map((node) => ({
      level: node.tagName,
      text: node.textContent,
    })),
    controls: Array.from(document.querySelectorAll('input,textarea,select')).map((node) => ({
      html: node.outerHTML,
    })),
  })
  // Group 2 regression: Rating semantics is the only pending axe finding (Group 3).
  for (const violation of results.violations.filter(({ id }) => id === 'aria-prohibited-attr')) {
    for (const node of violation.nodes) expect(node.html).toContain('aria-label="Calificación"')
  }
  expect(results.violations.filter(({ id }) => id !== 'aria-prohibited-attr')).toEqual([])
  expect(document.querySelectorAll('h1')).toHaveLength(1)
  const levels = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map((node) =>
    Number(node.tagName.slice(1)),
  )
  levels.forEach((level, index) => {
    if (index > 0) expect(level).toBeLessThanOrEqual((levels[index - 1] ?? 0) + 1)
  })
  for (const img of Array.from(document.querySelectorAll('img'))) expect(img).toHaveAttribute('alt')
  for (const th of Array.from(document.querySelectorAll('th'))) {
    expect(th).toHaveAttribute('scope', 'col')
    if (th.querySelector('button'))
      expect(['ascending', 'descending', 'none']).toContain(th.getAttribute('aria-sort'))
  }
  for (const field of Array.from(document.querySelectorAll('[aria-invalid="true"]'))) {
    const errorIds = field.getAttribute('aria-describedby')?.split(' ') ?? []
    expect(
      errorIds.some((id) => document.getElementById(id)?.getAttribute('role') === 'alert'),
    ).toBe(true)
  }
  // Keep the full raw report for outstanding groups.
  expect(results.passes.length).toBeGreaterThan(0)
  view.unmount()
  router.dispose()
  useCartStore.getState().closeDrawer()
  useUiStore.getState().closeMobileNav()
})
afterAll(() => {
  mkdirSync('coverage/a11y', { recursive: true })
  writeFileSync('coverage/a11y/results.json', JSON.stringify(reports, null, 2))
})
