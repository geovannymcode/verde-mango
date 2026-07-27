export interface CatalogProductCard {
  id: string | number
  slug: string
  name: string
  category?: string | null
  price: number
  compareAtPrice?: number | null
  image?: string | null
  rating?: number | null
  reviewCount?: number
  inStock: boolean
  tag?: 'nuevo' | 'oferta' | 'agotado'
}
