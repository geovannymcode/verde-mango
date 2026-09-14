import { Minus, Plus } from 'lucide-react'

interface QuantityStepperProps {
  quantity: number
  onChange: (quantity: number) => void
  min?: number
  max?: number
  disabled?: boolean
}

export function QuantityStepper({
  quantity,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
}: QuantityStepperProps) {
  return (
    <div className="flex items-center rounded-vm-full border border-vm-line">
      <button
        type="button"
        aria-label="Disminuir cantidad"
        disabled={disabled || quantity <= min}
        onClick={() => onChange(Math.max(min, quantity - 1))}
        className="flex h-8 w-8 items-center justify-center text-vm-ink hover:bg-vm-cream disabled:opacity-30"
      >
        <Minus size={14} />
      </button>
      <span className="w-8 text-center text-sm font-semibold text-vm-ink" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        aria-label="Aumentar cantidad"
        disabled={disabled || quantity >= max}
        onClick={() => onChange(Math.min(max, quantity + 1))}
        className="flex h-8 w-8 items-center justify-center text-vm-ink hover:bg-vm-cream disabled:opacity-30"
      >
        <Plus size={14} />
      </button>
    </div>
  )
}
