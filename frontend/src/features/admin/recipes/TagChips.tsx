import { useId, useState } from 'react'
import type { TagResponse } from '@/api/schema'
export function TagChips({
  tags,
  value,
  onChange,
}: {
  tags: TagResponse[]
  value: number[]
  onChange: (ids: number[]) => void
}) {
  const id = useId()
  const [search, setSearch] = useState('')
  const options = tags.filter(
    (t) => !value.includes(t.id) && t.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  )
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        Tags
      </label>
      <div className="flex flex-wrap gap-2">
        {value.map((tagId) => (
          <button
            type="button"
            key={tagId}
            onClick={() => onChange(value.filter((i) => i !== tagId))}
            aria-label={`Quitar tag ${tags.find((t) => t.id === tagId)?.name ?? tagId}`}
            className="rounded-full bg-vm-cream px-3 py-1 text-sm"
          >
            {tags.find((t) => t.id === tagId)?.name ?? `Tag ${tagId}`} ×
          </button>
        ))}
      </div>
      <input
        id={id}
        list={`${id}-tags`}
        value={search}
        placeholder="Busca un tag existente"
        className="h-11 w-full rounded-md border border-vm-line px-4"
        onChange={(e) => {
          const text = e.target.value
          const tag = options.find((t) => t.name === text)
          if (tag) {
            onChange([...value, tag.id])
            setSearch('')
          } else setSearch(text)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            const tag = options.find(
              (t) => t.name.toLocaleLowerCase() === search.toLocaleLowerCase(),
            )
            if (tag) {
              onChange([...value, tag.id])
              setSearch('')
            }
          }
        }}
      />
      <datalist id={`${id}-tags`}>
        {options.map((t) => (
          <option key={t.id} value={t.name} />
        ))}
      </datalist>
      {search && (
        <div className="flex flex-wrap gap-2">
          {options.slice(0, 8).map((t) => (
            <button
              type="button"
              className="rounded border border-vm-line px-3 py-1 text-sm"
              key={t.id}
              onClick={() => {
                onChange([...value, t.id])
                setSearch('')
              }}
            >
              {t.name}
            </button>
          ))}
          {!options.length && (
            <p className="text-sm text-vm-muted">
              No hay tags coincidentes. La API no permite crear tags.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
