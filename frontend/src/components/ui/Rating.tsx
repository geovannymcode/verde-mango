import { Star } from 'lucide-react'

interface RatingProps {
  value: number
  count?: number
  size?: number
  onChange?: (value: number) => void
  className?: string
}

const STARS = [1, 2, 3, 4, 5]

export function Rating({ value, count, size = 16, onChange, className = '' }: RatingProps) {
  const interactive = !!onChange
  const rounded = Math.round(value)

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div
        className="flex items-center"
        role={interactive ? 'radiogroup' : undefined}
        aria-label="Calificación"
      >
        {STARS.map((star) => {
          const filled = star <= rounded

          if (!interactive) {
            return (
              <Star
                key={star}
                size={size}
                className={filled ? 'fill-vm-orange text-vm-orange' : 'fill-none text-vm-line'}
              />
            )
          }

          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={star === rounded}
              aria-label={`Calificar con ${star} estrella${star > 1 ? 's' : ''}`}
              onClick={() => onChange?.(star)}
              className="rounded-vm-sm p-0.5 focus-visible:outline-none"
            >
              <Star
                size={size}
                className={filled ? 'fill-vm-orange text-vm-orange' : 'fill-none text-vm-line'}
              />
            </button>
          )
        })}
      </div>
      {typeof count === 'number' && <span className="text-xs text-vm-muted">({count})</span>}
    </div>
  )
}
