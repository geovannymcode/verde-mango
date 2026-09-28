/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { buttonClasses } from '@/lib/buttonClasses'

const css = readFileSync('src/index.css', 'utf8')
function token(name: string): string {
  const value = css.match(new RegExp(`${name}:\\s*([^;]+);`))?.[1]?.trim()
  if (!value) throw new Error(`Token ausente: ${name}`)
  const alias = value.match(/^var\((--[\w-]+)\)$/)?.[1]
  if (alias) return token(alias)
  if (!/^#[\da-f]{6}$/i.test(value)) throw new Error(`Color no soportado: ${value}`)
  return value
}
function rgb(hex: string) {
  return [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16))
}
function luminance(channels: number[]) {
  return channels.reduce((sum, channel, index) => {
    const s = channel / 255
    return (
      sum +
      (s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4) *
        ([0.2126, 0.7152, 0.0722][index] ?? 0)
    )
  }, 0)
}
function contrast(foreground: number[], background: number[]) {
  const a = luminance(foreground),
    b = luminance(background)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}
// Explicit approved uses, not a brittle scan of Tailwind class strings or jsdom layout.
const approvedPairs = [
  {
    use: 'texto pequeño sobre blanco',
    foreground: '--color-vm-orange-text',
    background: '--color-vm-white',
    minimum: 4.5,
  },
  {
    use: 'texto pequeño sobre crema',
    foreground: '--color-vm-orange-text',
    background: '--color-vm-cream',
    minimum: 4.5,
  },
  {
    use: 'texto grande sobre blanco',
    foreground: '--color-vm-orange',
    background: '--color-vm-white',
    minimum: 3,
  },
]
it.each(approvedPairs)(
  '$use cumple AA usando los tokens reales',
  ({ foreground, background, minimum }) => {
    expect(contrast(rgb(token(foreground)), rgb(token(background)))).toBeGreaterThanOrEqual(minimum)
  },
)
it('badge/enlace activo sobre tinte naranja al 10% en blanco cumple AA', () => {
  const white = rgb(token('--color-vm-white'))
  const tint = rgb(token('--color-vm-orange')).map(
    (channel, index) => channel * 0.1 + white[index]! * 0.9,
  )
  expect(contrast(rgb(token('--color-vm-orange-text')), tint)).toBeGreaterThanOrEqual(4.5)
})
it('el mapeo Tailwind conserva los dos tokens de marca aprobados', () => {
  expect(token('--color-vm-orange-text').toLowerCase()).toBe('#c73c20')
  expect(token('--color-vm-orange').toLowerCase()).toBe('#ff5b3b')
})

it.each(['sm', 'md', 'lg'] as const)(
  'botón naranja %s: tipografía y fondo cumplen AA también en hover',
  (size) => {
    const classes = buttonClasses('solid-orange', size)
    expect(classes).toContain('font-bold')
    expect(classes).not.toContain('hover:bg-vm-orange/90')
    expect(classes).toContain('text-[19px]')
    expect(classes).toContain('bg-vm-orange ')
    expect(
      contrast(rgb(token('--color-vm-white')), rgb(token('--color-vm-orange'))),
    ).toBeGreaterThanOrEqual(3)
  },
)
