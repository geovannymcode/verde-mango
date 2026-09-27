import { useState } from 'react'
import { screen, within, waitFor } from '@testing-library/react'
import { expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { http, HttpResponse } from 'msw'
import { Rating } from '@/components/ui/Rating'
import { RecipeRatings } from '@/components/recipes/RecipeRatings'
import { ProductReviews } from '@/components/catalog/ProductReviews'
import { useAuthStore } from '@/store/authStore'
import { renderWithProviders } from '../utils'
import { server } from '../msw/server'
import { makeUser } from '../msw/factories'
import { apiResponse, pageResponse } from '../msw/responses'

const options = { rules: { 'color-contrast': { enabled: false } } }
function Editable() {
  const [value, setValue] = useState(0)
  return (
    <main>
      <Rating label="Calificación del producto" value={value} onChange={setValue} />
      <button>Después</button>
    </main>
  )
}
it('radiogroup: una parada, cuatro flechas, Home/End, Enter/Espacio y axe', async () => {
  const { user, container } = renderWithProviders(<Editable />)
  const group = screen.getByRole('radiogroup', { name: 'Calificación del producto' })
  const star = (value: number) =>
    within(group).getByRole('radio', { name: `${value} de 5 estrellas` })
  const selected = (value: number) => {
    expect(star(value)).toHaveFocus()
    expect(star(value)).toHaveAttribute('aria-checked', 'true')
    expect(
      within(group)
        .getAllByRole('radio')
        .filter((radio) => radio.tabIndex === 0),
    ).toHaveLength(1)
  }
  await user.tab()
  expect(star(1)).toHaveFocus()
  expect(star(1)).toHaveAttribute('aria-checked', 'false')
  await user.keyboard(' ')
  selected(1)
  await user.keyboard('{ArrowRight}')
  selected(2)
  await user.keyboard('{ArrowDown}')
  selected(3)
  await user.keyboard('{ArrowLeft}')
  selected(2)
  await user.keyboard('{ArrowUp}')
  selected(1)
  await user.keyboard('{ArrowLeft}')
  selected(5)
  await user.keyboard('{Home}')
  selected(1)
  await user.keyboard('{End}{Enter}')
  selected(5)
  expect(star(5)).toHaveClass('focus-visible:outline-vm-ink', 'focus-visible:outline-2')
  expect(star(5)).not.toHaveClass('focus-visible:outline-none')
  await user.tab()
  expect(screen.getByRole('button', { name: 'Después' })).toHaveFocus()
  await user.tab({ shift: true })
  selected(5)
  expect((await axe(container, options)).violations).toEqual([])
})
it('readonly: texto de valor/conteo, sin radios ni paradas de Tab; axe', async () => {
  const { user, container } = renderWithProviders(
    <main>
      <button>Antes</button>
      <Rating value={4} count={12} />
      <Rating value={3.5} />
      <button>Después</button>
    </main>,
  )
  expect(screen.getByText('4 de 5 estrellas, 12 valoraciones')).toBeInTheDocument()
  expect(screen.getByText('3,5 de 5 estrellas')).toBeInTheDocument()
  expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
  expect(screen.queryByRole('radio')).not.toBeInTheDocument()
  await user.tab()
  expect(screen.getByRole('button', { name: 'Antes' })).toHaveFocus()
  await user.tab()
  expect(screen.getByRole('button', { name: 'Después' })).toHaveFocus()
  expect((await axe(container, options)).violations).toEqual([])
})
it.each(['producto', 'receta'] as const)(
  'calificación de %s: teclado hasta POST real interceptado por MSW',
  async (kind) => {
    useAuthStore.getState().setSession('audit', 'audit', makeUser())
    const base =
      kind === 'producto' ? '/api/v1/products/1/ratings' : '/api/v1/recipes/quinua/ratings'
    const requests: Array<{ method: string; path: string; body: unknown }> = []
    server.use(
      http.get(`*${base}`, () => HttpResponse.json(apiResponse(pageResponse([])))),
      http.get(`*${base}/stats`, () =>
        HttpResponse.json(apiResponse({ averageRating: 0, totalRatings: 0, distribution: {} })),
      ),
      http.post(`*${base}`, async ({ request }) => {
        requests.push({
          method: request.method,
          path: new URL(request.url).pathname,
          body: await request.json(),
        })
        return HttpResponse.json(apiResponse({ id: 1, rating: 4 }))
      }),
    )
    const { user, container } = renderWithProviders(
      <main>
        {kind === 'producto' ? (
          <ProductReviews productId={1} />
        ) : (
          <RecipeRatings slug="quinua" average={0} count={0} />
        )}
      </main>,
    )
    const group = await screen.findByRole('radiogroup', {
      name: kind === 'producto' ? 'Calificación del producto' : 'Calificación de la receta',
    })
    await user.tab()
    expect(within(group).getByRole('radio', { name: '1 de 5 estrellas' })).toHaveFocus()
    await user.keyboard('{End}{ArrowLeft}{Enter}')
    expect(within(group).getByRole('radio', { name: '4 de 5 estrellas' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    await user.tab()
    if (kind === 'producto') {
      expect(screen.getByLabelText('Título (opcional)')).toHaveFocus()
      await user.tab()
    }
    const comment = screen.getByLabelText(kind === 'producto' ? 'Comentario' : 'Tu comentario')
    expect(comment).toHaveFocus()
    await user.keyboard('Muy buena preparación para compartir.')
    await user.tab()
    if (kind === 'receta') {
      expect(screen.getByRole('checkbox', { name: 'Preparé esta receta' })).toHaveFocus()
      await user.keyboard(' ')
      await user.tab()
    }
    expect(
      screen.getByRole('button', {
        name: kind === 'producto' ? 'Enviar reseña' : 'Publicar valoración',
      }),
    ).toHaveFocus()
    expect((await axe(container, options)).violations).toEqual([])
    await user.keyboard('{Enter}')
    await waitFor(() =>
      expect(requests).toEqual([
        {
          method: 'POST',
          path: base,
          body: {
            rating: 4,
            comment: 'Muy buena preparación para compartir.',
            ...(kind === 'receta' ? { madeRecipe: true } : {}),
          },
        },
      ]),
    )
  },
)
