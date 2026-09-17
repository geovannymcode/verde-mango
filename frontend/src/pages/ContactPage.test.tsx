import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ContactPage } from './ContactPage'
import { useUiStore } from '@/store/uiStore'
import * as contact from '@/api/contact'
function fill() {
  fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Ana María' } })
  fireEvent.change(screen.getByLabelText('Correo electrónico'), {
    target: { value: 'ana@example.com' },
  })
  fireEvent.change(screen.getByLabelText('Asunto'), { target: { value: 'Productos' } })
  fireEvent.change(screen.getByLabelText('Comentarios'), {
    target: { value: 'Quisiera conocer sus productos.' },
  })
}
beforeEach(() => useUiStore.setState({ toasts: [] }))
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})
describe('contact form', () => {
  it('shows inline accessible Spanish errors and does not submit invalid inputs', async () => {
    const send = vi.spyOn(contact, 'sendContactMessage')
    render(<ContactPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }))
    await waitFor(() =>
      expect(screen.getByLabelText('Comentarios')).toHaveAttribute('aria-invalid', 'true'),
    )
    expect(screen.getByLabelText('Comentarios')).toHaveAccessibleDescription(
      'Escribe un mensaje de al menos 10 caracteres.',
    )
    expect(send).not.toHaveBeenCalled()
  })
  it('preserves input and reports unavailable through the existing toast store', async () => {
    const time = vi.spyOn(Date, 'now').mockReturnValue(1_800_000_000_000)
    render(<ContactPage />)
    fill()
    time.mockReturnValue(1_800_000_003_000)
    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }))
    await waitFor(() => expect(useUiStore.getState().toasts[0]?.variant).toBe('error'))
    expect(useUiStore.getState().toasts[0]?.message).toContain('no se enviará')
    expect(screen.getByLabelText('Nombre completo')).toHaveValue('Ana María')
    expect(screen.getByRole('note')).toHaveTextContent('todavía no está disponible')
  })
  it('disables submission while pending and resets only on confirmed success', async () => {
    let finish: () => void = () => undefined
    vi.spyOn(contact, 'sendContactMessage').mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve
        }),
    )
    render(<ContactPage />)
    fill()
    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Enviando mensaje' })).toBeDisabled(),
    )
    await act(async () => finish())
    await waitFor(() => expect(screen.getByLabelText('Nombre completo')).toHaveValue(''))
    expect(useUiStore.getState().toasts[0]?.variant).toBe('success')
  })
  it('embeds the supplied Barranquilla address with accessible lazy loading', () => {
    render(<ContactPage />)
    const map = screen.getByTitle(
      'Mapa de Verde Mango: Calle 112 # 43 - 123, Alameda del Río, Barranquilla, Colombia',
    )
    expect(map).toHaveAttribute('loading', 'lazy')
    expect(map.getAttribute('src')).toContain('Barranquilla')
  })
})
