import { lazy, type ComponentType } from 'react'
import { act, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { RouteBoundary } from '@/components/routing/RouteBoundary'
import { renderWithProviders } from './utils'

it('muestra skeleton accesible mientras llega el chunk y después su contenido', async () => {
  let resolve!: (module: { default: ComponentType }) => void
  const Deferred = lazy(
    () =>
      new Promise<{ default: ComponentType }>((done) => {
        resolve = done
      }),
  )
  const { container } = renderWithProviders(
    <main>
      <RouteBoundary>
        <Deferred />
      </RouteBoundary>
    </main>,
  )
  expect(screen.getByRole('status', { name: 'Cargando página' })).toBeInTheDocument()
  expect(container.querySelector('.animate-spin')).toBeNull()
  expect(
    (await axe(container, { rules: { 'color-contrast': { enabled: false } } })).violations,
  ).toEqual([])
  await act(async () => resolve({ default: () => <h1>Página cargada</h1> }))
  expect(await screen.findByRole('heading', { name: 'Página cargada' })).toBeInTheDocument()
  expect(screen.queryByRole('status', { name: 'Cargando página' })).not.toBeInTheDocument()
})

it.each(['Failed to fetch dynamically imported module', 'Importing a module script failed'])(
  'chunk rechazado: %s, mensaje y recarga real solicitada',
  async (message) => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const reload = vi.fn()
    const originalWindow = window
    vi.stubGlobal(
      'window',
      new Proxy(originalWindow, {
        get(target, key) {
          return key === 'location' ? { reload } : Reflect.get(target, key, target)
        },
      }),
    )
    const Broken = lazy(() => Promise.reject(new Error(message)))
    const { user, container } = renderWithProviders(
      <main>
        <RouteBoundary>
          <Broken />
        </RouteBoundary>
      </main>,
    )
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar esta página')
    expect(
      (await axe(container, { rules: { 'color-contrast': { enabled: false } } })).violations,
    ).toEqual([])
    await user.click(screen.getByRole('button', { name: 'Recargar página' }))
    expect(reload).toHaveBeenCalledTimes(1)
  },
)
