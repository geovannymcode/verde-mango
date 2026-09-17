import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  useRecipeRatings,
  useRecipeRatingStats,
  useCreateRecipeRating,
} from '@/features/recipes/hooks'
import { useAuthStore } from '@/store/authStore'
import { Rating } from '@/components/ui/Rating'
import { Button } from '@/components/ui/Button'
import { Pagination } from '@/components/ui/Pagination'
import { formatRecipeDate } from '@/lib/formatters'
import { RecipeError } from './RecipeQueryState'
import { Skeleton } from '@/components/ui/Skeleton'
const schema = z.object({
  rating: z.number().int().min(1, 'Selecciona de 1 a 5 estrellas').max(5),
  comment: z.string().trim().max(2000, 'Máximo 2000 caracteres'),
  madeRecipe: z.boolean(),
})
type Values = z.infer<typeof schema>
export function RecipeRatings({
  slug,
  average,
  count,
}: {
  slug: string
  average: number
  count: number
}) {
  const [page, setPage] = useState(1)
  const ratings = useRecipeRatings(slug, { page: page - 1, size: 5 })
  const stats = useRecipeRatingStats(slug)
  const mutation = useCreateRecipeRating(slug)
  const status = useAuthStore((state) => state.status)
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { rating: 0, comment: '', madeRecipe: false },
  })
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold">Valoraciones</h2>
      <div className="flex flex-wrap items-center gap-3">
        <Rating
          value={stats.data?.averageRating ?? average}
          count={stats.data?.totalRatings ?? count}
        />
        <span>
          {(stats.data?.averageRating ?? average).toFixed(1)} de 5 ·{' '}
          {stats.data?.totalRatings ?? count} valoraciones
        </span>
      </div>
      {stats.isError && (
        <RecipeError
          message="No pudimos actualizar el promedio de valoraciones."
          retry={() => void stats.refetch()}
        />
      )}
      {status !== 'authenticated' ? (
        <p>
          <Link
            className="font-bold text-vm-green underline"
            to={`/login?returnTo=${encodeURIComponent(`/recetas/${slug}`)}`}
          >
            Inicia sesión
          </Link>{' '}
          para calificar esta receta.
        </p>
      ) : (
        <form
          className="space-y-4 rounded-vm-lg border border-vm-line p-5"
          onSubmit={form.handleSubmit((values) =>
            mutation.mutate(values, {
              onSuccess: () => {
                form.reset()
                setPage(1)
              },
            }),
          )}
        >
          <h3 className="text-lg font-bold">¿Qué te pareció esta receta?</h3>
          <Controller
            name="rating"
            control={form.control}
            render={({ field }) => (
              <Rating value={field.value} onChange={field.onChange} size={24} />
            )}
          />
          {form.formState.errors.rating && (
            <p role="alert" className="text-sm text-red-600">
              {form.formState.errors.rating.message}
            </p>
          )}
          <label className="block">
            Tu comentario
            <textarea
              {...form.register('comment')}
              maxLength={2000}
              rows={4}
              className="mt-2 block w-full rounded-vm-md border border-vm-line p-3"
            />
          </label>
          {form.formState.errors.comment && (
            <p role="alert" className="text-red-600">
              {form.formState.errors.comment.message}
            </p>
          )}
          <label className="flex items-center gap-2">
            <input type="checkbox" {...form.register('madeRecipe')} />
            Preparé esta receta
          </label>
          {mutation.isError && (
            <p role="alert" className="text-red-600">
              {mutation.error.message}
            </p>
          )}
          {mutation.isSuccess && (
            <p role="status" className="text-vm-green">
              Tu valoración se guardó. ¡Gracias por compartirla!
            </p>
          )}
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Enviando…' : 'Publicar valoración'}
          </Button>
        </form>
      )}
      {ratings.isPending && <Skeleton className="h-32 w-full" />}
      {ratings.isError && (
        <RecipeError
          message="No pudimos cargar las valoraciones."
          retry={() => void ratings.refetch()}
        />
      )}
      {ratings.data?.content.length === 0 && (
        <p className="text-vm-muted">Sé la primera persona en valorar esta receta.</p>
      )}
      {!ratings.isError &&
        ratings.data?.content.map((rating) => (
          <article key={rating.id} className="space-y-2 border-b border-vm-line pb-5">
            <div className="flex flex-wrap justify-between gap-2">
              <h3 className="font-bold">{rating.userName || 'Usuario'}</h3>
              <time className="text-sm text-vm-muted" dateTime={rating.createdAt}>
                {formatRecipeDate(rating.createdAt)}
              </time>
            </div>
            <Rating value={rating.rating} />
            {rating.madeRecipe && <p className="text-sm text-vm-green">Preparó esta receta</p>}
            {rating.comment && (
              <p className="max-w-[70ch] whitespace-pre-line leading-relaxed">{rating.comment}</p>
            )}
          </article>
        ))}
      <Pagination page={page} totalPages={ratings.data?.totalPages ?? 0} onPageChange={setPage} />
    </section>
  )
}
