import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { useCreateRating, useProductRatingStats, useProductRatings } from '@/features/catalog/hooks'
import type { CreateRatingFormValues } from '@/lib/validators'
import { Rating } from '@/components/ui/Rating'
import { Pagination } from '@/components/ui/Pagination'
import { Skeleton } from '@/components/ui/Skeleton'
import { ReviewForm } from '@/components/catalog/ReviewForm'

interface ProductReviewsProps {
  productId: number
}

const PAGE_SIZE = 5

export function ProductReviews({ productId }: ProductReviewsProps) {
  const [page, setPage] = useState(1)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const currentUserId = useAuthStore((state) => state.user?.id)
  const pushToast = useUiStore((state) => state.pushToast)

  const statsQuery = useProductRatingStats(productId)
  const ratingsQuery = useProductRatings(productId, { page: page - 1, size: PAGE_SIZE })
  const createRating = useCreateRating(productId)

  function handleSubmit(values: CreateRatingFormValues) {
    createRating.mutate(
      { rating: values.rating, title: values.title || undefined, comment: values.comment },
      {
        onSuccess: () => {
          pushToast({ message: 'Gracias por tu reseña.', variant: 'success' })
          setPage(1)
        },
        onError: () => {
          pushToast({
            message: 'No pudimos enviar tu reseña. Intenta de nuevo.',
            variant: 'error',
          })
        },
      },
    )
  }

  const ratings = ratingsQuery.data?.content ?? []
  const totalPages = ratingsQuery.data?.totalPages ?? 0

  return (
    <div className="flex flex-col gap-8">
      {statsQuery.data && statsQuery.data.totalRatings > 0 && (
        <div className="flex items-center gap-3">
          <Rating value={statsQuery.data.averageRating ?? 0} size={20} />
          <span className="text-sm text-vm-muted">
            {statsQuery.data.averageRating?.toFixed(1)} de 5 · {statsQuery.data.totalRatings}{' '}
            reseñas
          </span>
        </div>
      )}

      {ratingsQuery.isLoading && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {!ratingsQuery.isLoading && ratings.length === 0 && (
        <p className="text-sm text-vm-muted">Este producto aún no tiene reseñas.</p>
      )}

      <ul className="flex flex-col gap-4">
        {ratings.map((review) => (
          <li key={review.id} className="rounded-vm-lg border border-vm-line p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-vm-ink">
                {review.userId === currentUserId ? 'Tú' : `Usuario #${review.userId}`}
              </span>
              <span className="text-xs text-vm-muted">
                {new Date(review.createdAt).toLocaleDateString('es-CO')}
              </span>
            </div>
            <Rating value={review.rating} size={14} className="mt-1" />
            {review.title && <p className="mt-2 font-semibold text-vm-ink">{review.title}</p>}
            {review.comment && <p className="mt-1 text-sm text-vm-muted">{review.comment}</p>}
          </li>
        ))}
      </ul>

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}

      {isAuthenticated ? (
        <ReviewForm onSubmit={handleSubmit} isSubmitting={createRating.isPending} />
      ) : (
        <div className="rounded-vm-lg border border-vm-line bg-vm-cream p-5 text-center">
          <p className="text-sm text-vm-ink">
            <Link to="/login" className="font-semibold text-vm-orange hover:underline">
              Inicia sesión
            </Link>{' '}
            para dejar tu reseña.
          </p>
        </div>
      )}
    </div>
  )
}
