import { fireEvent, screen, waitFor } from '@testing-library/react'
import { useLocation } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { CatalogPage } from '@/pages/CatalogPage'
import { renderWithProviders } from '../utils'
import { server } from '../msw/server'
import { makeCategory, makeProductListItem } from '../msw/factories'
import { apiResponse, pageResponse } from '../msw/responses'

function paramsRecord(params: URLSearchParams) {
  const result: Record<string, string> = {}
  params.forEach((value, key) => {
    result[key] = value
  })
  return result
}
function Location() {
  const location = useLocation()
  return (
    <output aria-label="Ruta actual">
      {location.pathname}
      {location.search}
    </output>
  )
}
function setup() {
  const products = [
    makeProductListItem({ id: 1, name: 'Kimchi suave', slug: 'kimchi-suave', price: 18000 }),
    makeProductListItem({ id: 2, name: 'Kimchi especial', slug: 'kimchi-especial', price: 32000 }),
    makeProductListItem({
      id: 3,
      name: 'Kombucha',
      slug: 'kombucha',
      price: 19000,
      categoryId: 2,
      categoryName: 'Bebidas',
      categorySlug: 'bebidas',
    }),
  ]
  const requests: Array<{
    method: string
    origin: string
    path: string
    params: Record<string, string>
    body: string
  }> = []
  server.use(
    http.get('*/api/v1/categories', () =>
      HttpResponse.json(
        apiResponse([
          makeCategory({ productCount: 2 }),
          makeCategory({ id: 2, name: 'Bebidas', slug: 'bebidas', productCount: 1 }),
        ]),
      ),
    ),
    http.get('*/api/v1/products', async ({ request }) => {
      const url = new URL(request.url)
      // Sidebar is a separate query; keep its feed empty to distinguish catalog results.
      if (url.searchParams.get('size') === '4')
        return HttpResponse.json(apiResponse(pageResponse([])))
      requests.push({
        method: request.method,
        origin: url.origin,
        path: url.pathname,
        params: paramsRecord(url.searchParams),
        body: await request.text(),
      })
      const category = url.searchParams.get('category')
      const min = Number(url.searchParams.get('minPrice') ?? 0)
      const max = Number(url.searchParams.get('maxPrice') ?? Infinity)
      const rows = products.filter(
        (p) => (!category || p.categorySlug === category) && p.price >= min && p.price <= max,
      )
      return HttpResponse.json(apiResponse(pageResponse(rows, 0, 12)))
    }),
  )
  return {
    requests,
    ...renderWithProviders(
      <>
        <Location />
        <CatalogPage />
      </>,
      { initialEntries: ['/tienda'] },
    ),
  }
}
const defaultParams = { page: '0', size: '12', sortBy: 'newest', sortDir: 'desc' }
function assertLastRequest(context: ReturnType<typeof setup>, params: Record<string, string>) {
  expect(context.requests.at(-1)).toEqual({
    method: 'GET',
    origin: 'http://localhost:3000',
    path: '/api/v1/products',
    params: { ...defaultParams, ...params },
    body: '',
  })
}
function urlParams() {
  return paramsRecord(
    new URL(screen.getByLabelText('Ruta actual').textContent!, 'http://localhost').searchParams,
  )
}
async function filter(context: ReturnType<typeof setup>, max: number) {
  await screen.findByRole('button', { name: 'Agregar Kombucha al carrito' })
  await context.user.click(await screen.findByRole('button', { name: /Fermentos\s*\(\s*2\s*\)/ }))
  await waitFor(() =>
    expect(
      screen.queryByRole('button', { name: 'Agregar Kombucha al carrito' }),
    ).not.toBeInTheDocument(),
  )
  // user-event/jsdom does not implement native slider dragging; dispatch the input change.
  fireEvent.change(screen.getByRole('slider', { name: 'Precio mínimo' }), {
    target: { value: '10000' },
  })
  fireEvent.change(screen.getByRole('slider', { name: 'Precio máximo' }), {
    target: { value: String(max) },
  })
  await waitFor(() =>
    expect(urlParams()).toEqual({
      categoria: 'fermentos',
      minPrecio: '10000',
      maxPrecio: String(max),
    }),
  )
  await waitFor(() =>
    assertLastRequest(context, { category: 'fermentos', minPrice: '10000', maxPrice: String(max) }),
  )
}
describe('tienda: filtros URL → request → resultados', () => {
  it('filtra categoría y rango de precio con debounce y muestra solo coincidencias', async () => {
    const context = setup()
    await filter(context, 20000)
    await waitFor(() => expect(context.queryClient.isFetching()).toBe(0))
    expect(screen.getByRole('button', { name: 'Agregar Kimchi suave al carrito' })).toBeVisible()
    expect(
      screen.queryByRole('button', { name: 'Agregar Kimchi especial al carrito' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Agregar Kombucha al carrito' }),
    ).not.toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(1)
  })
  it('muestra vacío y limpiar restaura URL, rango y resultados', async () => {
    const context = setup()
    await filter(context, 15000)
    expect(await screen.findByText('No encontramos productos con esos filtros.')).toBeVisible()
    expect(screen.queryAllByRole('article')).toHaveLength(0)
    await context.user.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    await waitFor(() => expect(urlParams()).toEqual({}))
    await waitFor(() => assertLastRequest(context, {}))
    await waitFor(() => expect(context.queryClient.isFetching()).toBe(0))
    expect(screen.getAllByRole('article')).toHaveLength(3)
    expect(screen.getByRole('slider', { name: 'Precio mínimo' })).toHaveValue('0')
    expect(screen.getByRole('slider', { name: 'Precio máximo' })).toHaveValue('100000')
    expect(screen.queryByText('No encontramos productos con esos filtros.')).not.toBeInTheDocument()
  })
})
