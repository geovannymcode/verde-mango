import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { useUrlFilters } from './useUrlFilters'
function Harness() {
  const filters = useUrlFilters()
  return (
    <>
      <input
        aria-label="search"
        value={filters.searchInput}
        onChange={(e) => filters.setSearchInput(e.target.value)}
      />
      <output data-testid="url">{filters.searchParams.toString()}</output>
      <output data-testid="page">{filters.page}</output>
      <button onClick={() => filters.updateParams({ categoria: 'ensaladas' })}>category</button>
      <button onClick={() => filters.updateParams({ page: '3' }, false)}>page</button>
      <button onClick={filters.clearFilters}>clear</button>
    </>
  )
}
function setup(url = '/recetas') {
  const router = createMemoryRouter([{ path: '*', element: <Harness /> }], {
    initialEntries: [url],
  })
  render(<RouterProvider router={router} />)
  return router
}
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})
describe('shared URL filters', () => {
  it('debounces search by 400ms and resets page while retaining filters', async () => {
    vi.useFakeTimers()
    setup('/recetas?categoria=almuerzo&page=4')
    fireEvent.change(screen.getByLabelText('search'), { target: { value: 'quinoa' } })
    await act(() => vi.advanceTimersByTimeAsync(399))
    expect(screen.getByTestId('url')).not.toHaveTextContent('quinoa')
    await act(() => vi.advanceTimersByTimeAsync(1))
    expect(screen.getByTestId('url')).toHaveTextContent('categoria=almuerzo&q=quinoa')
    expect(screen.getByTestId('page')).toHaveTextContent('1')
  })
  it('preserves catalog parameters on pagination and resets only page on category change', () => {
    setup('/tienda?q=arroz&minPrecio=5000&orden=precio-asc&page=2')
    fireEvent.click(screen.getByText('page'))
    expect(screen.getByTestId('url')).toHaveTextContent(
      'q=arroz&minPrecio=5000&orden=precio-asc&page=3',
    )
    fireEvent.click(screen.getByText('category'))
    expect(screen.getByTestId('url')).toHaveTextContent(
      'q=arroz&minPrecio=5000&orden=precio-asc&categoria=ensaladas',
    )
  })
  it('discards pending typing on browser navigation and clearing', async () => {
    vi.useFakeTimers()
    const router = setup('/recetas?q=avena')
    fireEvent.change(screen.getByLabelText('search'), { target: { value: 'stale' } })
    await act(() => router.navigate('/recetas?q=arroz&page=2'))
    await act(() => vi.advanceTimersByTimeAsync(500))
    expect(screen.getByLabelText('search')).toHaveValue('arroz')
    expect(screen.getByTestId('url')).toHaveTextContent('q=arroz&page=2')
    fireEvent.change(screen.getByLabelText('search'), { target: { value: 'stale again' } })
    fireEvent.click(screen.getByText('clear'))
    await act(() => vi.advanceTimersByTimeAsync(500))
    expect(screen.getByTestId('url')).toBeEmptyDOMElement()
    expect(screen.getByLabelText('search')).toHaveValue('')
  })
  it.each(['NaN', '-1', '2.5', '0', 'Infinity'])('normalizes invalid page %s', (page) => {
    setup(`/recetas?page=${page}`)
    expect(screen.getByTestId('page')).toHaveTextContent('1')
  })
})
