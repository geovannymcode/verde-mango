import { z } from 'zod'
import { imageUrlSchema } from '@/api/imageSource'
export function toSlug(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}
const slug = z.string().min(1, 'Escribe un slug.').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Usa minúsculas, números y guiones.')
export const productSchema = z.object({
  name: z.string().trim().min(2, 'Escribe al menos 2 caracteres.').max(255, 'Máximo 255 caracteres.'),
  slug: slug.max(300, 'Máximo 300 caracteres.'),
  description: z.string(),
  price: z.number({ error: 'Ingresa un precio.' }).int('Usa pesos enteros.').positive('El precio debe ser mayor que cero.').max(Number.MAX_SAFE_INTEGER, 'Precio demasiado alto.'),
  stock: z.number({ error: 'Ingresa el stock.' }).int('El stock debe ser entero.').min(0, 'El stock no puede ser negativo.').max(2147483647, 'Stock demasiado alto.'),
  categoryId: z.number({ error: 'Selecciona una categoría.' }).int().positive('Selecciona una categoría.'),
  featured: z.boolean(), active: z.boolean(),
  images: z.array(z.object({ key: z.string(), url: imageUrlSchema, altText: z.string().optional() })).max(10, 'Máximo 10 imágenes.'),
})
export type ProductFormValues = z.infer<typeof productSchema>
export const categorySchema = z.object({
  name: z.string().trim().min(2, 'Escribe al menos 2 caracteres.').max(100, 'Máximo 100 caracteres.'),
  slug: slug.max(120, 'Máximo 120 caracteres.'), description: z.string(),
  imageUrl: z.union([z.literal(''), imageUrlSchema]),
  sortOrder: z.number({ error: 'Ingresa un orden.' }).int('El orden debe ser entero.').min(0, 'El orden no puede ser negativo.').max(2147483647),
  active: z.boolean(),
})
export type CategoryFormValues = z.infer<typeof categorySchema>
