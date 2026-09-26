import type { components } from '@/api/openapi.gen'
export type Schema = components['schemas']
export const fixtureDate = '2026-01-01T12:00:00Z'
// Concrete annotated literals (no casts): new required DTO fields break compilation.
export function makeUser(overrides: Partial<Schema['UserResponse']> = {}): Schema['UserResponse'] {
  return {
    id: 1,
    email: 'cliente@example.test',
    firstName: 'Cliente',
    lastName: 'Prueba',
    fullName: 'Cliente Prueba',
    role: 'CUSTOMER',
    emailVerified: true,
    createdAt: fixtureDate,
    ...overrides,
  }
}
export function makeTokens(
  overrides: Partial<Schema['TokenResponse']> = {},
): Schema['TokenResponse'] {
  return {
    accessToken: 'test-access',
    refreshToken: 'test-refresh',
    tokenType: 'Bearer',
    expiresIn: 900,
    ...overrides,
  }
}
export function makeAuth(overrides: Partial<Schema['AuthResponse']> = {}): Schema['AuthResponse'] {
  return { ...makeTokens(), user: makeUser(), ...overrides }
}
export function makeCategory(
  overrides: Partial<Schema['CategorySummary']> = {},
): Schema['CategorySummary'] {
  return { id: 1, name: 'Fermentos', slug: 'fermentos', productCount: 1, ...overrides }
}
export function makeProductListItem(
  overrides: Partial<Schema['ProductListResponse']> = {},
): Schema['ProductListResponse'] {
  return {
    id: 1,
    name: 'Kimchi de prueba',
    slug: 'kimchi-prueba',
    price: 18000,
    priceFormatted: '$ 18.000',
    discountPercentage: 0,
    stock: 12,
    isInStock: true,
    isLowStock: false,
    featured: false,
    ratingCount: 0,
    categoryId: 1,
    categoryName: 'Fermentos',
    categorySlug: 'fermentos',
    ...overrides,
  }
}
export function makeProduct(
  overrides: Partial<Schema['ProductResponse']> = {},
): Schema['ProductResponse'] {
  return {
    id: 1,
    name: 'Kimchi de prueba',
    slug: 'kimchi-prueba',
    price: 18000,
    priceFormatted: '$ 18.000',
    discountPercentage: 0,
    stock: 12,
    isInStock: true,
    isLowStock: false,
    featured: false,
    ratingCount: 0,
    category: makeCategory(),
    discountAmount: 0,
    trackInventory: true,
    allowBackorder: false,
    active: true,
    images: [],
    createdAt: fixtureDate,
    updatedAt: fixtureDate,
    ...overrides,
  }
}
export function makeCartItem(
  overrides: Partial<Schema['CartItemResponse']> = {},
): Schema['CartItemResponse'] {
  const item = {
    id: 1,
    productId: 1,
    productName: 'Kimchi de prueba',
    productSlug: 'kimchi-prueba',
    quantity: 1,
    unitPrice: 18000,
    unitPriceFormatted: '$ 18.000',
    ...overrides,
  }
  const subtotal = item.quantity * item.unitPrice
  return {
    ...item,
    subtotal,
    subtotalFormatted: `$ ${subtotal.toLocaleString('es-CO')}`,
    ...overrides,
  }
}
export function makeCart(overrides: Partial<Schema['CartResponse']> = {}): Schema['CartResponse'] {
  const items = overrides.items ?? []
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
  return {
    id: 1,
    status: 'ACTIVE',
    items,
    itemCount: items.length,
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    subtotalFormatted: `$ ${subtotal.toLocaleString('es-CO')}`,
    createdAt: fixtureDate,
    updatedAt: fixtureDate,
    ...overrides,
  }
}
export function makeOrder(
  overrides: Partial<Schema['OrderResponse']> = {},
): Schema['OrderResponse'] {
  return {
    id: 1,
    orderNumber: 'VM-TEST-001',
    status: 'PENDING',
    statusLabel: 'Pendiente',
    items: [],
    itemCount: 0,
    subtotal: 0,
    subtotalFormatted: '$ 0',
    shippingCost: 0,
    taxAmount: 0,
    discountAmount: 0,
    totalAmount: 0,
    totalFormatted: '$ 0',
    shippingAddress: {
      recipientName: 'Cliente Prueba',
      phone: '3000000000',
      streetAddress: 'Dirección de prueba',
      city: 'Barranquilla',
      country: 'Colombia',
      formatted: 'Dirección de prueba, Barranquilla',
    },
    statusHistory: [],
    canBeCancelled: true,
    createdAt: fixtureDate,
    updatedAt: fixtureDate,
    ...overrides,
  }
}
export function makeCheckout(
  overrides: Partial<Schema['CheckoutResponse']> = {},
): Schema['CheckoutResponse'] {
  return {
    orderNumber: 'VM-TEST-001',
    status: 'PENDING',
    message: 'Orden de prueba creada',
    ...overrides,
  }
}
export function makeCheckoutValidation(
  overrides: Partial<Schema['CheckoutValidationResponse']> = {},
): Schema['CheckoutValidationResponse'] {
  return {
    valid: true,
    items: [],
    subtotal: 0,
    shippingCost: 0,
    taxAmount: 0,
    total: 0,
    errors: [],
    ...overrides,
  }
}
export function makeRecipe(
  overrides: Partial<Schema['RecipeResponse']> = {},
): Schema['RecipeResponse'] {
  return {
    id: 1,
    title: 'Quinua de prueba',
    slug: 'quinua-prueba',
    description: 'Receta de prueba',
    prepTime: 10,
    cookTime: 20,
    totalTime: 30,
    totalTimeFormatted: '30 min',
    servings: 2,
    servingsUnit: 'porciones',
    difficulty: 'EASY',
    difficultyLabel: 'Fácil',
    status: 'PUBLISHED',
    featured: false,
    views: 0,
    ratingCount: 0,
    ratingAverage: 0,
    ratingFormatted: '0.0',
    steps: [],
    ingredients: [],
    images: [],
    tags: [],
    createdAt: fixtureDate,
    updatedAt: fixtureDate,
    ...overrides,
  }
}
export function makeRecipeListItem(
  overrides: Partial<Schema['RecipeListResponse']> = {},
): Schema['RecipeListResponse'] {
  const r = makeRecipe()
  return {
    id: r.id,
    title: r.title,
    slug: r.slug,
    description: r.description,
    totalTime: r.totalTime,
    totalTimeFormatted: r.totalTimeFormatted,
    difficulty: r.difficulty,
    difficultyLabel: r.difficultyLabel,
    ratingAverage: r.ratingAverage,
    ratingCount: r.ratingCount,
    featured: r.featured,
    status: r.status,
    ...overrides,
  }
}
