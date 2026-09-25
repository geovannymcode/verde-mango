import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { parseIngredients, type IngredientValues } from './form'
export function IngredientPaste({ onApply }: { onApply: (rows: IngredientValues[]) => void }) {
  const [text, setText] = useState(''),
    [review, setReview] = useState<IngredientValues[] | null>(null)
  function change(index: number, key: 'name' | 'quantity' | 'unit', value: string) {
    setReview((rows) => rows?.map((r, i) => (i === index ? { ...r, [key]: value } : r)) ?? null)
  }
  return (
    <details className="rounded-md bg-stone-50 p-4">
      <summary className="cursor-pointer font-semibold">Pegar ingredientes en bloque</summary>
      <div className="mt-4 space-y-4">
        <Textarea
          id="paste-ingredients"
          label="Una línea por ingrediente"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setReview(null)
          }}
          placeholder={'2 tazas de quinua\n1/2 cucharadita de sal'}
        />
        <Button
          type="button"
          variant="outline"
          disabled={!text.trim()}
          onClick={() => setReview(parseIngredients(text))}
        >
          Revisar filas
        </Button>
        {review && (
          <div className="space-y-3">
            <p>
              Revisa cantidad, unidad y nombre antes de agregar. Las unidades desconocidas se
              conservan en el nombre.
            </p>
            {review.map((row, index) => (
              <div key={index} className="grid gap-3 sm:grid-cols-3">
                {(['quantity', 'unit', 'name'] as const).map((key) => (
                  <Input
                    key={key}
                    id={`paste-${index}-${key}`}
                    label={`${key === 'quantity' ? 'Cantidad' : key === 'unit' ? 'Unidad' : 'Nombre'} ${index + 1}`}
                    value={row[key]}
                    onChange={(e) => change(index, key, e.target.value)}
                  />
                ))}
              </div>
            ))}
            <Button
              type="button"
              disabled={review.length === 0}
              onClick={() => {
                onApply(review)
                setReview(null)
                setText('')
              }}
            >
              Agregar filas revisadas
            </Button>
          </div>
        )}
      </div>
    </details>
  )
}
