import { describe, expect, it } from 'vitest'
import { productSchema, toSlug } from './catalogForms'
const valid = { name: 'Mango fresco', slug: 'mango-fresco', description: '', price: 4500, stock: 0, categoryId: 1, featured: false, active: true, images: [] }
describe('product form contract', () => {
  it.each([['Piña y Limón', 'pina-y-limon'], ['  Árbol / Ñame! ', 'arbol-name'], ['A---B', 'a-b']])('normalizes %s', (value, slug) => expect(toSlug(value)).toBe(slug))
  it('accepts positive pesos and zero stock', () => expect(productSchema.safeParse(valid).success).toBe(true))
  it.each([{ price: 0 }, { price: -1 }, { price: 1.5 }, { stock: -1 }, { stock: 0.5 }, { categoryId: 0 }, { slug: 'No Válido' }, { images: [{ key: 'x', url: 'javascript:alert(1)' }] }])('rejects invalid input %j', patch => expect(productSchema.safeParse({ ...valid, ...patch }).success).toBe(false))
})
