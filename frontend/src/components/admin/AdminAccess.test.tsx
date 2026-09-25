import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AdminRoute } from '@/components/auth/AdminRoute'
import { AdminLayout } from './AdminLayout'
import { useAuthStore } from '@/store/authStore'
import type { UserResponse } from '@/api/schema'
const user: UserResponse = {
  id: 1,
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'Prueba',
  fullName: 'Admin Prueba',
  role: 'ADMIN',
  emailVerified: true,
  createdAt: '2026-01-01T12:00:00Z',
}
afterEach(() => {
  cleanup()
  useAuthStore.setState({ user: null, accessToken: null, status: 'anonymous' })
})
function setup(role: UserResponse['role'] | 'anonymous' | 'loading') {
  useAuthStore.setState({
    user: role === 'anonymous' || role === 'loading' ? null : { ...user, role },
    status: role === 'anonymous' || role === 'loading' ? role : 'authenticated',
  })
  const router = createMemoryRouter(
    [
      {
        path: '/admin',
        element: (
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        ),
        children: [{ index: true, element: <p>Contenido protegido</p> }],
      },
      { path: '/login', element: <p>Login</p> },
    ],
    { initialEntries: ['/admin'] },
  )
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}
describe('admin shell access', () => {
  it.each(['ADMIN', 'SUPER_ADMIN'] as const)(
    'admits %s and keeps future sections disabled',
    (role) => {
      setup(role)
      expect(screen.getByText('Contenido protegido')).toBeInTheDocument()
      expect(screen.getByText(role)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Productos' })).toHaveAttribute(
        'href',
        '/admin/productos',
      )
      expect(screen.getByRole('link', { name: 'Órdenes' })).toHaveAttribute(
        'href',
        '/admin/ordenes',
      )
      expect(screen.getByRole('link', { name: 'Recetas' })).toHaveAttribute(
        'href',
        '/admin/recetas',
      )
      expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
    },
  )
  it('redirects anonymous users with returnTo', async () => {
    const router = setup('anonymous')
    await screen.findByText('Login')
    expect(router.state.location.search).toContain('returnTo=%2Fadmin')
  })
  it('refuses CUSTOMER without rendering the shell', () => {
    setup('CUSTOMER')
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('navigation', { name: 'Navegación de administración' }),
    ).not.toBeInTheDocument()
  })
  it('waits during bootstrap', () => {
    setup('loading')
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument()
    expect(screen.queryByText('Login')).not.toBeInTheDocument()
  })
})
