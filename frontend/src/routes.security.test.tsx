import { cloneElement, isValidElement, type ReactNode } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { matchRoutes, MemoryRouter } from 'react-router-dom'
import { router } from './routes'
import { AdminRoute } from './components/auth/AdminRoute'
import { useAuthStore } from './store/authStore'
import type { UserResponse } from './api/schema'

afterEach(() => {
  cleanup()
  useAuthStore.setState({ user: null, status: 'anonymous' })
})
const paths = ['/admin/recetas', '/admin/recetas/nueva', '/admin/recetas/7/editar']
describe('Rutas reales de administración de recetas', () => {
  it.each(['/cuenta/recetas', '/cuenta/recetas/nueva', '/cuenta/recetas/7/editar'])(
    '%s ya no resuelve a un editor administrativo',
    (path) => {
      const matches = matchRoutes(router.routes, path)
      expect(matches?.at(-1)?.route.path).toBe('*')
      expect(matches?.some((m) => m.route.path === 'cuenta')).toBe(false)
    },
  )
  it.each(paths)('%s exige rol en el guard configurado', (path) => {
    const matches = matchRoutes(router.routes, path)
    const guard = matches?.[0]?.route.element
    expect(matches?.at(-1)?.route.path).not.toBe('*')
    if (!isValidElement<{ children: ReactNode }>(guard)) throw new Error('Falta guard')
    expect(guard.type).toBe(AdminRoute)
    const user: UserResponse = {
      id: 1,
      email: 'qa@example.test',
      firstName: 'QA',
      lastName: 'Prueba',
      fullName: 'QA Prueba',
      role: 'CUSTOMER',
      emailVerified: true,
      createdAt: '2026-01-01T00:00:00Z',
    }
    useAuthStore.setState({ user, status: 'authenticated' })
    render(
      <MemoryRouter initialEntries={[path]}>
        {cloneElement(guard, {}, <p>Editor protegido</p>)}
      </MemoryRouter>,
    )
    expect(screen.queryByText('Editor protegido')).not.toBeInTheDocument()
    cleanup()
    for (const role of ['ADMIN', 'SUPER_ADMIN'] as const) {
      useAuthStore.setState({ user: { ...user, role }, status: 'authenticated' })
      render(
        <MemoryRouter initialEntries={[path]}>
          {cloneElement(guard, {}, <p>Editor protegido</p>)}
        </MemoryRouter>,
      )
      expect(screen.getByText('Editor protegido')).toBeInTheDocument()
      cleanup()
    }
  })
})
