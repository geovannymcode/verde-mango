import { useState } from 'react'
import type { ProductImageResponse } from '@/api/schema'

interface ProductGalleryProps {
  images: ProductImageResponse[]
  productName: string
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeImage = images[activeIndex]

  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-square overflow-hidden rounded-vm-lg bg-vm-cream">
        <img
          src={activeImage?.url ?? '/placeholder-product.svg'}
          alt={activeImage?.altText ?? productName}
          className="h-full w-full object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Ver imagen ${index + 1} de ${productName}`}
              aria-current={index === activeIndex}
              className={`h-16 w-16 overflow-hidden rounded-vm-md border-2 ${
                index === activeIndex ? 'border-vm-orange' : 'border-transparent'
              }`}
            >
              <img
                src={image.url}
                alt={image.altText ?? productName}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
