import { useId, useState } from 'react'
import { ArrowLeft, ArrowRight, GripVertical, Trash2 } from 'lucide-react'
import { imageUrlSchema as imageUrl, prepareImageSource } from '@/api/imageSource'
import type { ProductImageResponse } from '@/api/schema'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
export type AdminImage = Pick<ProductImageResponse, 'url' | 'altText'> & { key: string }
interface ImageUploaderProps {
  images: readonly AdminImage[]
  onChange: (images: AdminImage[]) => void
  maxImages?: number
  title?: string
  description?: string
  disabled?: boolean
  onBusyChange?: (busy: boolean) => void
}
function ImagePreview({ url, alt }: { url: string; alt: string }) {
  const [failed, setFailed] = useState(false)
  return failed || !imageUrl.safeParse(url).success ? (
    <div
      role="status"
      className="flex aspect-[4/3] items-center justify-center bg-stone-50 px-4 text-center text-xs text-vm-muted"
    >
      No se pudo cargar la imagen. Revisa su URL.
    </div>
  ) : (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="aspect-[4/3] w-full object-cover"
    />
  )
}
/** URL-only fallback: no upload endpoint exists. Changes are local until the parent saves. */
export function ImageUploader({
  images,
  onChange,
  disabled,
  onBusyChange,
  maxImages = 10,
  title = 'Imágenes',
  description,
}: ImageUploaderProps) {
  const id = useId()
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string>()
  const [dragKey, setDragKey] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  async function add() {
    const parsed = imageUrl.safeParse(url)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message)
      return
    }
    if (images.some((image) => image.url === parsed.data)) {
      setError('Esta imagen ya está en la lista.')
      return
    }
    if (images.length >= maxImages) {
      setError(`Máximo ${maxImages} imágenes.`)
      return
    }
    setChecking(true)
    onBusyChange?.(true)
    setError(undefined)
    try {
      const verified = await prepareImageSource(parsed.data)
      onChange([...images, { key: crypto.randomUUID(), url: verified }])
      setUrl('')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo validar la imagen.')
    } finally {
      setChecking(false)
      onBusyChange?.(false)
    }
  }
  function move(from: number, to: number) {
    if (
      disabled ||
      checking ||
      from < 0 ||
      to < 0 ||
      from >= images.length ||
      to >= images.length ||
      from === to
    )
      return
    const next = [...images]
    const [image] = next.splice(from, 1)
    if (!image) return
    next.splice(to, 0, image)
    onChange(next)
  }
  return (
    <section className="space-y-4" aria-label={title}>
      <div>
        <h2 className="font-bold">{title}</h2>
        <p className="mt-1 text-sm text-vm-muted">
          {description ??
            'Agrega una URL pública de imagen. La primera será la principal al guardar. No se admiten           archivos en este momento. En edición solo se guarda la elección de la principal; el orden           de las demás lo define el servidor.'}
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <Input
            id={id}
            label="URL de imagen"
            type="url"
            placeholder="https://…"
            value={url}
            disabled={disabled || checking}
            error={error}
            onChange={(event) => setUrl(event.target.value)}
          />
        </div>
        <Button type="button" variant="outline" disabled={disabled || checking} onClick={add}>
          {checking ? 'Validando imagen…' : 'Agregar imagen'}
        </Button>
      </div>
      <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {images.map((image, index) => (
          <li
            key={image.key}
            onDragOver={(event) => {
              if (!disabled && !checking && dragKey) event.preventDefault()
            }}
            onDrop={(event) => {
              event.preventDefault()
              if (dragKey)
                move(
                  images.findIndex((item) => item.key === dragKey),
                  index,
                )
              setDragKey(null)
            }}
            className="overflow-hidden rounded-lg border border-vm-line"
          >
            <ImagePreview
              key={`${image.key}:${image.url}`}
              url={image.url}
              alt={image.altText || `Vista previa de imagen ${index + 1}`}
            />
            <div className="space-y-3 p-3">
              <div className="flex items-center justify-between text-sm">
                <span>{index === 0 ? 'Principal' : `Imagen ${index + 1}`}</span>
                <span
                  draggable={!disabled && !checking}
                  onDragStart={(event) => {
                    event.dataTransfer.setData('text/plain', image.key)
                    event.dataTransfer.effectAllowed = 'move'
                    setDragKey(image.key)
                  }}
                  onDragEnd={() => setDragKey(null)}
                  title="Arrastra para reordenar; también puedes usar los botones"
                  className="cursor-grab"
                >
                  <GripVertical size={18} aria-hidden="true" />
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled || checking || index === 0}
                  aria-label={`Mover imagen ${index + 1} antes`}
                  onClick={() => move(index, index - 1)}
                >
                  <ArrowLeft size={16} />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled || checking || index === images.length - 1}
                  aria-label={`Mover imagen ${index + 1} después`}
                  onClick={() => move(index, index + 1)}
                >
                  <ArrowRight size={16} />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled || checking}
                  aria-label={`Eliminar imagen ${index + 1}`}
                  onClick={() => onChange(images.filter((item) => item.key !== image.key))}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
