import { cleanup, render } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { useDocumentTitle } from './useDocumentTitle'
function Page({ title, description }: { title: string; description: string }) {
  useDocumentTitle(title, description)
  return null
}
afterEach(cleanup)
it('updates title and reuses one description element when navigating', () => {
  const { rerender } = render(<Page title="Nosotros" description="Historia" />)
  expect(document.title).toBe('Nosotros | Verde Mango')
  rerender(<Page title="Contáctenos" description="Contacto en Colombia" />)
  expect(document.title).toBe('Contáctenos | Verde Mango')
  expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(1)
  expect(document.head.querySelector('meta[name="description"]')).toHaveAttribute(
    'content',
    'Contacto en Colombia',
  )
})
