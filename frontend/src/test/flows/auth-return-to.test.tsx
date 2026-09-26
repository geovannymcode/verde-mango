import { screen, waitFor } from '@testing-library/react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { GuestRoute } from '@/components/auth/GuestRoute'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { resolveReturnTo } from '@/lib/returnTo'
import { useAuthStore } from '@/store/authStore'
import { renderWithProviders } from '../utils'
import { server } from '../msw/server'
import { makeAuth } from '../msw/factories'
import { apiResponse } from '../msw/responses'

function Location() {
  const location = useLocation()
  return (
    <output aria-label="Ruta actual">
      {location.pathname}
      {location.search}
    </output>
  )
}
function setup(entry: string) {
  useAuthStore.getState().setStatus('anonymous')
  const requests: Array<{ method: string; url: string; body: unknown }> = []
  server.use(
    http.post('*/api/v1/auth/:action', async ({ request }) => {
      requests.push({ method: request.method, url: request.url, body: await request.json() })
      return HttpResponse.json(apiResponse(makeAuth()))
    }),
  )
  return {
    requests,
    ...renderWithProviders(
      <>
        <Location />
        <Routes>
          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="/registro"
            element={
              <GuestRoute>
                <RegisterPage />
              </GuestRoute>
            }
          />
          <Route
            path="/cuenta/ordenes"
            element={
              <ProtectedRoute>
                <h1>Mis órdenes</h1>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<h1>Inicio</h1>} />
        </Routes>
      </>,
      { initialEntries: [entry] },
    ),
  }
}
async function submit(context: ReturnType<typeof setup>, register: boolean) {
  if (register) {
    await context.user.type(screen.getByLabelText('Nombre'), 'Ana')
    await context.user.type(screen.getByLabelText('Apellido'), 'Prueba')
    await context.user.type(screen.getByLabelText('Confirmar contraseña'), 'Clave123!')
  }
  await context.user.type(screen.getByLabelText('Correo electrónico'), 'ana@example.test')
  await context.user.type(screen.getByLabelText('Contraseña'), 'Clave123!')
  await context.user.click(
    screen.getByRole('button', { name: register ? 'Crear cuenta' : 'Iniciar sesión' }),
  )
  await waitFor(() =>
    expect(context.requests).toEqual([
      {
        method: 'POST',
        url: `http://localhost:3000/api/v1/auth/${register ? 'register' : 'login'}`,
        body: {
          ...(register ? { firstName: 'Ana', lastName: 'Prueba' } : {}),
          email: 'ana@example.test',
          password: 'Clave123!',
        },
      },
    ]),
  )
}
describe('returnTo de login y registro', () => {
  it.each([false, true])(
    'protección → login → registro=%s → destino interno con query',
    async (register) => {
      const context = setup('/cuenta/ordenes?page=2')
      await screen.findByRole('button', { name: 'Iniciar sesión' })
      expect(screen.getByLabelText('Ruta actual')).toHaveTextContent(
        '/login?returnTo=%2Fcuenta%2Fordenes%3Fpage%3D2',
      )
      await context.user.click(screen.getByRole('link', { name: 'Regístrate' }))
      expect(screen.getByLabelText('Ruta actual')).toHaveTextContent(
        '/registro?returnTo=%2Fcuenta%2Fordenes%3Fpage%3D2',
      )
      if (!register) await context.user.click(screen.getByRole('link', { name: 'Inicia sesión' }))
      await submit(context, register)
      expect(await screen.findByRole('heading', { name: 'Mis órdenes' })).toBeVisible()
      expect(screen.getByLabelText('Ruta actual')).toHaveTextContent('/cuenta/ordenes?page=2')
    },
  )
  it.each([false, true])('rechaza URL externa tras autenticar, registro=%s', async (register) => {
    const context = setup(
      `/${register ? 'registro' : 'login'}?returnTo=${encodeURIComponent('https://evil.example/robar')}`,
    )
    await submit(context, register)
    expect(await screen.findByRole('heading', { name: 'Inicio' })).toBeVisible()
    expect(screen.getByLabelText('Ruta actual')).toHaveTextContent(/^\/$/)
  })
  it.each([
    null,
    '',
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    '/\n/evil.example',
    'javascript:alert(1)',
    'cuenta',
    ' /cuenta',
  ])('rechaza destino inseguro %j', (value) => {
    expect(resolveReturnTo(value)).toBe('/')
  })
  it('preserva ruta interna, query y fragmento', () => {
    expect(resolveReturnTo('/cuenta/ordenes?page=2#detalle')).toBe('/cuenta/ordenes?page=2#detalle')
  })
})
