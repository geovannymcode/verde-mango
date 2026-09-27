import { useState } from 'react'
import { screen, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { Modal } from '@/components/ui/Modal'
import { Drawer } from '@/components/ui/Drawer'
import { MobileNav } from '@/components/layout/MobileNav'
import { useUiStore } from '@/store/uiStore'
import { renderWithProviders } from '../utils'

function Fixture({ kind }: { kind: 'Modal' | 'Drawer' | 'Menú' }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const Overlay = kind === 'Modal' ? Modal : Drawer
  return (
    <main>
      <button
        onClick={() => (kind === 'Menú' ? useUiStore.getState().openMobileNav() : setOpen(true))}
      >
        Abrir
      </button>
      <a href="#fuera">Fuera</a>
      {kind === 'Menú' ? (
        <MobileNav />
      ) : (
        <Overlay open={open} onClose={() => setOpen(false)} title="Confirmación">
          <label htmlFor="nota">Nota</label>
          <input id="nota" value={value} onChange={(event) => setValue(event.target.value)} />
          <button disabled>Deshabilitado</button>
          <button hidden>Oculto</button>
        </Overlay>
      )}
    </main>
  )
}

it.each(['Modal', 'Drawer', 'Menú'] as const)(
  '%s: axe, trampa inicial, ambos límites, Escape y devolución',
  async (kind) => {
    const { user } = renderWithProviders(<Fixture kind={kind} />)
    const trigger = screen.getByRole('button', { name: 'Abrir' })
    await user.click(trigger)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveFocus()
    expect(screen.getByRole('main', { hidden: true }).closest('[inert]')).not.toBeNull()
    expect(
      (await axe(dialog, { rules: { 'color-contrast': { enabled: false } } })).violations,
    ).toEqual([])
    const last =
      kind === 'Menú'
        ? within(dialog).getByRole('link', { name: 'Mi cuenta' })
        : within(dialog).getByRole('textbox', { name: 'Nota' })
    await user.tab({ shift: true })
    expect(last).toHaveFocus()
    await user.tab()
    expect(within(dialog).getByRole('button', { name: 'Cerrar' })).toHaveFocus()
    await user.tab({ shift: true })
    expect(last).toHaveFocus()
    // Programmatic focus cannot escape either (jsdom does not implement native inert).
    screen.getByText('Fuera').focus()
    expect(dialog).toHaveFocus()
    await user.tab()
    expect(within(dialog).getByRole('button', { name: 'Cerrar' })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
    expect(screen.getByRole('main').closest('[inert]')).toBeNull()
  },
)

it.each(['Modal', 'Drawer'] as const)(
  '%s: escribir no reinicia foco y cerrar devuelve al disparador',
  async (kind) => {
    const { user } = renderWithProviders(<Fixture kind={kind} />)
    const trigger = screen.getByRole('button', { name: 'Abrir' })
    await user.click(trigger)
    const input = screen.getByRole('textbox', { name: 'Nota' })
    await user.type(input, 'Una nota completa con varios caracteres')
    expect(input).toHaveFocus()
    expect(input).toHaveValue('Una nota completa con varios caracteres')
    await user.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(trigger).toHaveFocus()
  },
)
