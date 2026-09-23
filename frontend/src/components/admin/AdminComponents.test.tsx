vi.mock('@/api/imageSource', async (importOriginal) => ({ ...await importOriginal<typeof import('@/api/imageSource')>(), prepareImageSource: vi.fn(async (value: string) => value) }))
import { useState } from 'react'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMemoryRouter, Link, RouterProvider } from 'react-router-dom'
import { DataTable, type DataColumn } from './DataTable'
import { ConfirmDialog } from './ConfirmDialog'
import { FormShell } from './FormShell'
import { ImageUploader, type AdminImage } from './ImageUploader'
import { ApiError } from '@/api/types'

afterEach(cleanup)
const rows = [
  { id: 2, name: 'Zeta' },
  { id: 1, name: 'Alfa' },
]
const columns: DataColumn<(typeof rows)[number], 'name'>[] = [
  { id: 'name', header: 'Nombre', sortKey: 'name', cell: (row) => row.name },
]
const pagination = { page: 2, size: 2, totalElements: 8, totalPages: 4 }
describe('DataTable server-side', () => {
  it('delegates sort/page without sorting or slicing the server page', () => {
    const sort = vi.fn()
    const page = vi.fn()
    render(
      <DataTable
        caption="Productos"
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        pagination={pagination}
        onPageChange={page}
        sort={{ key: 'name', direction: 'asc' }}
        onSortChange={sort}
      />,
    )
    expect(screen.getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['Zeta', 'Alfa'])
    fireEvent.click(screen.getByRole('button', { name: 'Nombre' }))
    expect(sort).toHaveBeenCalledWith({ key: 'name', direction: 'desc' })
    fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }))
    expect(page).toHaveBeenCalledWith(3)
    expect(screen.getByText('3–4 de 8')).toBeInTheDocument()
  })
  it('keeps pagination bounded and hides unsupported sort controls', () => {
    render(
      <DataTable
        caption="Órdenes"
        columns={columns}
        rows={[]}
        rowKey={(row) => row.id}
        pagination={{ page: 1, size: 5, totalElements: 0, totalPages: 0 }}
        onPageChange={vi.fn()}
      />,
    )
    expect(screen.queryByRole('button', { name: 'Nombre' })).not.toBeInTheDocument()
    expect(screen.getByText('No hay registros para mostrar.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled()
  })
  it('shows an explicit permission error instead of an empty state on 403', () => {
    render(
      <DataTable
        caption="Órdenes"
        columns={columns}
        rows={[]}
        rowKey={(row) => row.id}
        pagination={pagination}
        onPageChange={vi.fn()}
        error={new ApiError('Forbidden', { status: 403 })}
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('No tienes permisos')
    expect(screen.queryByText('No hay registros para mostrar.')).not.toBeInTheDocument()
  })
})
it('requires exact confirmation and resets the text when reopened', () => {
  const confirm = vi.fn()
  const props = {
    title: 'Eliminar producto',
    description: 'Confirma esta acción.',
    requiredText: 'Mango',
    onConfirm: confirm,
    onCancel: vi.fn(),
  }
  const { rerender } = render(<ConfirmDialog open {...props} />)
  expect(screen.getByRole('button', { name: 'Confirmar' })).toBeDisabled()
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Mango' } })
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
  expect(confirm).toHaveBeenCalledOnce()
  rerender(<ConfirmDialog open={false} {...props} />)
  rerender(<ConfirmDialog open {...props} />)
  expect(screen.getByRole('textbox')).toHaveValue('')
})
it('guards dirty navigation and allows canceling or discarding it', async () => {
  const router = createMemoryRouter([
    {
      path: '/',
      element: (
        <FormShell
          title="Editar"
          isDirty
          isSubmitting={false}
          onSubmit={(event) => event.preventDefault()}
          onCancel={() => undefined}
        >
          <Link to="/salir">Salir</Link>
        </FormShell>
      ),
    },
    { path: '/salir', element: <p>Destino</p> },
  ])
  render(<RouterProvider router={router} />)
  fireEvent.click(screen.getByRole('link', { name: 'Salir' }))
  await screen.findByRole('dialog', { name: '¿Salir sin guardar?' })
  const dialog = screen.getByRole('dialog')
  fireEvent.click(
    Array.from(dialog.querySelectorAll('button')).find((button) => button.textContent === 'Cancelar')!,
  )
  expect(router.state.location.pathname).toBe('/')
  const unload = new Event('beforeunload', { cancelable: true })
  act(() => window.dispatchEvent(unload))
  expect(unload.defaultPrevented).toBe(true)
  fireEvent.click(screen.getByRole('link', { name: 'Salir' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Salir sin guardar' }))
  await waitFor(() => expect(router.state.location.pathname).toBe('/salir'))
})
function ImageHarness() {
  const [images, setImages] = useState<AdminImage[]>([])
  return (
    <>
      <ImageUploader images={images} onChange={setImages} />
      <output data-testid="urls">{images.map((image) => image.url).join(',')}</output>
    </>
  )
}
it('rejects unsafe URLs, prevents duplicates and supports keyboard-friendly reordering/removal', async () => {
  render(<ImageHarness />)
  const input = screen.getByLabelText('URL de imagen')
  const add = () => fireEvent.click(screen.getByRole('button', { name: 'Agregar imagen' }))
  fireEvent.change(input, { target: { value: 'javascript:alert(1)' } })
  add()
  expect(screen.getByText('Usa una URL HTTP o HTTPS.')).toBeInTheDocument()
  fireEvent.change(input, { target: { value: 'https://example.com/a.jpg' } })
  add()
  await waitFor(() => expect(screen.getByTestId('urls')).toHaveTextContent('https://example.com/a.jpg'))
  fireEvent.change(input, { target: { value: 'https://example.com/a.jpg' } })
  add()
  expect(screen.getByText('Esta imagen ya está en la lista.')).toBeInTheDocument()
  fireEvent.change(input, { target: { value: 'https://example.com/b.jpg' } })
  add()
  await waitFor(() => expect(screen.getByTestId('urls')).toHaveTextContent('https://example.com/b.jpg'))
  fireEvent.click(screen.getByRole('button', { name: 'Mover imagen 2 antes' }))
  expect(screen.getByTestId('urls')).toHaveTextContent(
    'https://example.com/b.jpg,https://example.com/a.jpg',
  )
  fireEvent.click(screen.getByRole('button', { name: 'Eliminar imagen 1' }))
  expect(screen.getByTestId('urls')).toHaveTextContent('https://example.com/a.jpg')
})
