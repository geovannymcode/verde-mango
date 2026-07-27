import { useEffect, useState } from 'react'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { formatCurrency } from '@/lib/formatters'
import { Button } from '@/components/ui/Button'

interface PriceRangeFilterProps {
  min: number
  max: number
  boundsMin?: number
  boundsMax?: number
  onApply: (min: number, max: number) => void
}

const STEP = 1000

export function PriceRangeFilter({
  min,
  max,
  boundsMin = 0,
  boundsMax = 100_000,
  onApply,
}: PriceRangeFilterProps) {
  const [draftMin, setDraftMin] = useState(min)
  const [draftMax, setDraftMax] = useState(max)
  const debouncedMin = useDebouncedValue(draftMin, 400)
  const debouncedMax = useDebouncedValue(draftMax, 400)

  useEffect(() => {
    setDraftMin(min)
    setDraftMax(max)
  }, [min, max])

  useEffect(() => {
    if (debouncedMin !== min || debouncedMax !== max) {
      onApply(debouncedMin, debouncedMax)
    }
    // Solo debe reaccionar a cambios del valor debounced, no a `min`/`max` externos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedMin, debouncedMax])

  function handleMinChange(value: number) {
    setDraftMin(Math.min(value, draftMax))
  }

  function handleMaxChange(value: number) {
    setDraftMax(Math.max(value, draftMin))
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-bold uppercase tracking-wide text-vm-ink">Precio</p>
      <p className="text-sm font-semibold text-vm-orange">
        PRECIO: {formatCurrency(draftMin)} — {formatCurrency(draftMax)}
      </p>
      <div className="relative flex h-5 items-center">
        <div className="absolute inset-x-0 h-1 rounded-vm-full bg-vm-line" />
        <input
          type="range"
          aria-label="Precio mínimo"
          min={boundsMin}
          max={boundsMax}
          step={STEP}
          value={draftMin}
          onChange={(event) => handleMinChange(Number(event.target.value))}
          className="absolute inset-x-0 h-1 w-full appearance-none bg-transparent accent-vm-orange"
        />
        <input
          type="range"
          aria-label="Precio máximo"
          min={boundsMin}
          max={boundsMax}
          step={STEP}
          value={draftMax}
          onChange={(event) => handleMaxChange(Number(event.target.value))}
          className="absolute inset-x-0 h-1 w-full appearance-none bg-transparent accent-vm-orange"
        />
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => onApply(draftMin, draftMax)}>
        Filtrar
      </Button>
    </div>
  )
}
