export interface CategoryMock {
  id: string
  name: string
  slug: string
  image: string
}

export interface ProductMock {
  id: string
  slug: string
  name: string
  category: string
  price: number
  compareAtPrice?: number
  image: string
  rating: number
  reviewCount: number
  inStock: boolean
  tag?: 'nuevo' | 'oferta' | 'agotado'
}

// `ProductMock` cumple estructuralmente con `CatalogProductCard` (src/types/catalog.ts),
// así que `ProductCard`/`ProductGrid` aceptan tanto mocks como datos reales de la API.

export interface RecipeMock {
  id: string
  slug: string
  title: string
  image: string
  minutes: number
  servings: number
  difficulty: 'Fácil' | 'Media' | 'Avanzada'
  excerpt: string
}

export const mockCategories: CategoryMock[] = [
  { id: 'cat-1', name: 'Fermentos', slug: 'fermentos', image: 'https://picsum.photos/seed/vm-cat-fermentos/240/240' },
  { id: 'cat-2', name: 'Veg-quesos', slug: 'veg-quesos', image: 'https://picsum.photos/seed/vm-cat-quesos/240/240' },
  { id: 'cat-3', name: 'Frutas', slug: 'frutas', image: 'https://picsum.photos/seed/vm-cat-frutas/240/240' },
  { id: 'cat-4', name: 'Verduras', slug: 'verduras', image: 'https://picsum.photos/seed/vm-cat-verduras/240/240' },
]

export const mockProducts: ProductMock[] = [
  {
    id: 'prod-1',
    slug: 'kimchi-clasico',
    name: 'Kimchi clásico 500g',
    category: 'Fermentos',
    price: 24900,
    compareAtPrice: 28900,
    image: 'https://picsum.photos/seed/vm-prod-1/480/480',
    rating: 4.6,
    reviewCount: 32,
    inStock: true,
    tag: 'oferta',
  },
  {
    id: 'prod-2',
    slug: 'queso-de-almendras',
    name: 'Veg-queso de almendras',
    category: 'Veg-quesos',
    price: 32900,
    image: 'https://picsum.photos/seed/vm-prod-2/480/480',
    rating: 4.8,
    reviewCount: 51,
    inStock: true,
    tag: 'nuevo',
  },
  {
    id: 'prod-3',
    slug: 'chucrut-artesanal',
    name: 'Chucrut artesanal 400g',
    category: 'Fermentos',
    price: 19900,
    image: 'https://picsum.photos/seed/vm-prod-3/480/480',
    rating: 4.4,
    reviewCount: 18,
    inStock: true,
  },
  {
    id: 'prod-4',
    slug: 'mango-deshidratado',
    name: 'Mango deshidratado 200g',
    category: 'Frutas',
    price: 15900,
    image: 'https://picsum.photos/seed/vm-prod-4/480/480',
    rating: 4.9,
    reviewCount: 64,
    inStock: true,
  },
  {
    id: 'prod-5',
    slug: 'queso-crema-cashew',
    name: 'Queso crema de cashew',
    category: 'Veg-quesos',
    price: 27900,
    image: 'https://picsum.photos/seed/vm-prod-5/480/480',
    rating: 4.5,
    reviewCount: 22,
    inStock: false,
    tag: 'agotado',
  },
  {
    id: 'prod-6',
    slug: 'canasta-de-verduras',
    name: 'Canasta de verduras de temporada',
    category: 'Verduras',
    price: 45900,
    image: 'https://picsum.photos/seed/vm-prod-6/480/480',
    rating: 4.7,
    reviewCount: 29,
    inStock: true,
  },
  {
    id: 'prod-7',
    slug: 'kombucha-jengibre',
    name: 'Kombucha de jengibre 750ml',
    category: 'Fermentos',
    price: 21900,
    image: 'https://picsum.photos/seed/vm-prod-7/480/480',
    rating: 4.3,
    reviewCount: 15,
    inStock: true,
    tag: 'nuevo',
  },
  {
    id: 'prod-8',
    slug: 'piña-golden',
    name: 'Piña golden orgánica',
    category: 'Frutas',
    price: 12900,
    image: 'https://picsum.photos/seed/vm-prod-8/480/480',
    rating: 4.6,
    reviewCount: 40,
    inStock: true,
  },
]

export const mockRecipes: RecipeMock[] = [
  {
    id: 'rec-1',
    slug: 'bowl-de-kimchi-y-quinoa',
    title: 'Bowl de kimchi y quinoa',
    image: 'https://picsum.photos/seed/vm-rec-1/480/360',
    minutes: 25,
    servings: 2,
    difficulty: 'Fácil',
    excerpt: 'Un bowl fresco y probiótico, perfecto para el almuerzo entre semana.',
  },
  {
    id: 'rec-2',
    slug: 'tostadas-con-queso-de-almendras',
    title: 'Tostadas con veg-queso de almendras',
    image: 'https://picsum.photos/seed/vm-rec-2/480/360',
    minutes: 15,
    servings: 1,
    difficulty: 'Fácil',
    excerpt: 'Un desayuno rápido, cremoso y lleno de sabor.',
  },
  {
    id: 'rec-3',
    slug: 'sopa-de-verduras-fermentadas',
    title: 'Sopa de verduras con chucrut',
    image: 'https://picsum.photos/seed/vm-rec-3/480/360',
    minutes: 40,
    servings: 4,
    difficulty: 'Media',
    excerpt: 'Reconfortante y llena de probióticos naturales.',
  },
  {
    id: 'rec-4',
    slug: 'smoothie-de-mango-y-kombucha',
    title: 'Smoothie de mango y kombucha',
    image: 'https://picsum.photos/seed/vm-rec-4/480/360',
    minutes: 10,
    servings: 2,
    difficulty: 'Fácil',
    excerpt: 'Refrescante, energizante y muy fácil de preparar.',
  },
]
