import { QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import { createTestQueryClient } from '../state'
import { render, screen, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { renderWithProviders } from '../utils'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { router as appRouter } from '@/routes'
import { useAuthStore } from '@/store/authStore'
import { makeUser } from '../msw/factories'
import { server } from '../msw/server'
import { http, HttpResponse } from 'msw'
import { apiResponse } from '../msw/responses'
import { auditData } from './data'

const axeOptions = { rules: { 'color-contrast': { enabled: false } } }
it('controles compartidos: labels únicos, ayuda conservada y errores asociados/anunciados', async () => {
  const { container, user } = renderWithProviders(
    <main>
      <p id="ayuda">Ayuda del campo</p>
      <Input label="Nombre" error="Escribe tu nombre" aria-describedby="ayuda" />
      <Input label="Apellido" />
      <Textarea label="Comentarios" error="Escribe un comentario" />
      <Select label="Categoría" error="Selecciona una categoría">
        <option value="">Selecciona</option>
      </Select>
      <PasswordInput label="Contraseña" error="Completa la contraseña" />
    </main>,
  )
  const fields = ['Nombre', 'Apellido', 'Comentarios', 'Categoría', 'Contraseña'].map((name) =>
    screen.getByLabelText(name),
  )
  expect(new Set(fields.map((field) => field.id)).size).toBe(5)
  for (const field of fields.filter((field) => field.getAttribute('aria-invalid') === 'true')) {
    const ids = field.getAttribute('aria-describedby')!.split(' ')
    expect(ids.some((id) => document.getElementById(id)?.getAttribute('role') === 'alert')).toBe(
      true,
    )
  }
  expect(fields[0]).toHaveAccessibleDescription('Ayuda del campo Escribe tu nombre')
  fields[4]?.focus()
  await user.tab()
  expect(screen.getByRole('button', { name: 'Mostrar contraseña' })).toHaveFocus()
  await user.keyboard('{Enter}')
  expect(fields[4]).toHaveAttribute('type', 'text')
  expect((await axe(container, axeOptions)).violations).toEqual([])
})

it('useFieldArray: grupos, labels y acciones identifican la fila tras agregar, mover y eliminar', async () => {
  useAuthStore.getState().setSession('audit', 'audit', makeUser({ role: 'SUPER_ADMIN' }))
  server.use(
    http.all('*/api/v1/*', ({ request }) =>
      HttpResponse.json(apiResponse(auditData(new URL(request.url).pathname))),
    ),
  )
  const router = createMemoryRouter(appRouter.routes, {
    initialEntries: ['/admin/recetas/1/editar'],
  })
  const user = userEvent.setup()
  const client = createTestQueryClient()
  const view = render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  await screen.findByRole('button', { name: 'Agregar ingrediente' })
  await user.click(screen.getByRole('button', { name: 'Agregar ingrediente' }))
  await user.click(screen.getByRole('button', { name: 'Agregar paso' }))
  const check = () => {
    for (const [kind, fieldLabel] of [
      ['Ingrediente', 'Nombre'],
      ['Paso', 'Descripción del paso'],
    ] as const) {
      for (const index of [1, 2]) {
        const row = screen.getByRole('group', { name: `${kind} ${index}` })
        const field = within(row).getByLabelText(`${fieldLabel} ${index}`)
        expect(field.id).not.toBe('')
        expect(within(row).getByRole('button', { name: `Mover ${kind} ${index}` })).toBeEnabled()
        expect(
          within(row).getByRole('button', { name: `Eliminar ${kind.toLowerCase()} ${index}` }),
        ).toBeEnabled()
      }
    }
    const ids = Array.from(document.querySelectorAll('input,textarea,select'))
      .map((element) => element.id)
      .filter(Boolean)
    expect(new Set(ids).size).toBe(ids.length)
  }
  check()
  screen.getByRole('button', { name: 'Mover Ingrediente 2' }).focus()
  await user.keyboard('{ArrowUp}')
  screen.getByRole('button', { name: 'Mover Paso 2' }).focus()
  await user.keyboard('{ArrowUp}')
  check()
  await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
  const category = screen.getByLabelText('Categoría')
  expect(category).toHaveAttribute('aria-invalid', 'true')
  expect(category).toHaveAccessibleDescription('Selecciona una categoría.')
  expect((await axe(document.body, axeOptions)).violations).toEqual([])
  await user.click(screen.getByRole('button', { name: 'Eliminar ingrediente 1' }))
  await user.click(screen.getByRole('button', { name: 'Eliminar paso 1' }))
  expect(screen.queryByRole('group', { name: 'Ingrediente 2' })).not.toBeInTheDocument()
  expect(screen.getByRole('group', { name: 'Paso 1' })).toBeInTheDocument()
  expect((await axe(document.body, axeOptions)).violations).toEqual([])
  view.unmount()
  router.dispose()
  client.clear()
})
