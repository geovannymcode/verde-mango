import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createRatingSchema, type CreateRatingFormValues } from '@/lib/validators'
import { Rating } from '@/components/ui/Rating'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface ReviewFormProps {
  onSubmit: (values: CreateRatingFormValues) => void
  isSubmitting: boolean
}

export function ReviewForm({ onSubmit, isSubmitting }: ReviewFormProps) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateRatingFormValues>({
    resolver: zodResolver(createRatingSchema),
    defaultValues: { rating: 0, title: '', comment: '' },
  })

  function submit(values: CreateRatingFormValues) {
    onSubmit(values)
    reset()
  }

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="flex flex-col gap-4 rounded-vm-lg border border-vm-line p-5"
    >
      <p className="font-bold text-vm-ink">Deja tu reseña</p>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-vm-ink">Calificación</span>
        <Controller
          control={control}
          name="rating"
          render={({ field }) => (
            <Rating value={field.value} onChange={field.onChange} size={22} />
          )}
        />
        {errors.rating && <span className="text-xs text-red-500">{errors.rating.message}</span>}
      </div>

      <Input label="Título (opcional)" {...register('title')} error={errors.title?.message} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="comment" className="text-sm font-medium text-vm-ink">
          Comentario
        </label>
        <textarea
          id="comment"
          rows={4}
          {...register('comment')}
          placeholder="Cuéntanos qué te pareció el producto…"
          className="rounded-vm-md border border-vm-line bg-vm-white px-4 py-3 text-sm text-vm-ink placeholder:text-vm-muted focus-visible:border-vm-orange focus-visible:outline-none"
        />
        {errors.comment && <span className="text-xs text-red-500">{errors.comment.message}</span>}
      </div>

      <Button type="submit" disabled={isSubmitting} className="self-start">
        {isSubmitting ? 'Enviando…' : 'Enviar reseña'}
      </Button>
    </form>
  )
}
