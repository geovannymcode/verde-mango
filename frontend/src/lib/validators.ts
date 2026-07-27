import { z } from 'zod'

export const createRatingSchema = z.object({
  rating: z
    .number({ error: 'Selecciona una calificación' })
    .int()
    .min(1, 'La calificación mínima es 1 estrella')
    .max(5, 'La calificación máxima es 5 estrellas'),
  title: z.string().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
  comment: z
    .string()
    .min(10, 'El comentario debe tener al menos 10 caracteres')
    .max(1000, 'El comentario no puede superar los 1000 caracteres'),
})

export type CreateRatingFormValues = z.infer<typeof createRatingSchema>
