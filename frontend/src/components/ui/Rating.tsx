import { useId, useRef } from 'react'
import { Star } from 'lucide-react'

type RatingProps = {
  value: number
  count?: number
  size?: number
  className?: string
} & (
  | { onChange: (value: number) => void; label: string; error?: string }
  | { onChange?: undefined; label?: never; error?: never }
)

const STARS = [1, 2, 3, 4, 5]

export function Rating({
  value,
  count,
  size = 16,
  onChange,
  label,
  error,
  className = '',
}: RatingProps) {
  const errorId = useId()
  const radios = useRef<Array<HTMLButtonElement | null>>([])
  const rounded = Math.max(0, Math.min(5, Math.round(value)))
  const description = `${value.toLocaleString('es-CO')} de 5 estrellas${count === undefined ? '' : `, ${count} ${count === 1 ? 'valoración' : 'valoraciones'}`}`
  function select(star: number) {
    onChange?.(star)
    radios.current[star - 1]?.focus()
  }
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-center gap-1">
        {!onChange && <span className="sr-only">{description}</span>}
        <div
          className="flex items-center"
          role={onChange ? 'radiogroup' : undefined}
          aria-label={onChange ? label : undefined}
          aria-hidden={onChange ? undefined : true}
          aria-invalid={onChange ? !!error : undefined}
          aria-describedby={onChange && error ? errorId : undefined}
        >
          {STARS.map((star) => {
            const icon = (
              <Star
                aria-hidden="true"
                size={size}
                className={
                  star <= rounded ? 'fill-vm-orange text-vm-orange' : 'fill-none text-vm-line'
                }
              />
            )
            if (!onChange) return <span key={star}>{icon}</span>
            return (
              <button
                key={star}
                ref={(node) => {
                  radios.current[star - 1] = node
                }}
                type="button"
                role="radio"
                aria-checked={star === rounded}
                aria-label={`${star} de 5 estrellas`}
                tabIndex={star === (rounded || 1) ? 0 : -1}
                onClick={() => onChange(star)}
                onKeyDown={(event) => {
                  let next: number
                  switch (event.key) {
                    case 'ArrowRight':
                    case 'ArrowDown':
                      next = star === 5 ? 1 : star + 1
                      break
                    case 'ArrowLeft':
                    case 'ArrowUp':
                      next = star === 1 ? 5 : star - 1
                      break
                    case 'Home':
                      next = 1
                      break
                    case 'End':
                      next = 5
                      break
                    default:
                      return
                  }
                  event.preventDefault()
                  select(next)
                }}
                className="rounded-vm-sm p-0.5 hover:bg-vm-cream focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-vm-ink focus-visible:outline-offset-2"
              >
                {icon}
              </button>
            )
          })}
        </div>
        {typeof count === 'number' && (
          <span aria-hidden="true" className="text-xs text-vm-muted">
            ({count})
          </span>
        )}
      </div>
      {error && (
        <span id={errorId} role="alert" className="text-xs text-red-500">
          {error}
        </span>
      )}
    </div>
  )
}
