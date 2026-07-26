# Gaps entre el diseño del frontend y la API real (`/api-docs`)

Generado a partir del OpenAPI real exportado el 2026-07-25 desde `http://localhost:8080/api-docs`
(66 paths, 87 schemas). Copia local en `frontend/openapi/verde-mango-openapi.json`.

## Endpoints faltantes

### Favoritos / Wishlist
El diseño del header pide un ícono de favoritos (corazón). **No existe ningún endpoint
de wishlist/favoritos en el backend** (`auth`, `catalog`, `orders`, `payment`, `recipes`
no exponen nada relacionado). Alcance para la Fase 1+:

- El ícono de corazón se implementa en el header pero queda **deshabilitado / solo visual**
  hasta que el backend exponga el módulo, o
- Se implementa como favoritos **100% client-side** (localStorage), sin persistencia en
  el backend, dejándolo documentado como limitación conocida.

Se decidirá en la fase de Layout/Home cuál de las dos opciones tomar.

## Endpoints presentes y verificados (sin gaps)

Todo lo demás requerido por el prompt maestro está cubierto 1:1 por el OpenAPI real:

- **Auth**: `/api/v1/auth/{register,login,refresh,logout,me}`
- **Catalog**: `/api/v1/products` (con filtros `category,minPrice,maxPrice,inStock,search,page,size,sortBy,sortDir`),
  `/products/featured`, `/products/{slug}`, `/products/id/{id}`, `/products/{id}/related`,
  `/categories`, `/categories/menu`, `/categories/{slug}`,
  `/products/{productId}/ratings*`
- **Orders**: `/cart*`, `/checkout*`, `/orders*`
- **Admin**: `/admin/products*`, `/admin/categories*`, `/admin/orders*`, `/admin/recipes*`
- **Recipes**: `/recipes*`, `/recipes/categories*`, `/recipes/tags*`, `/recipes/{recipeSlug}/ratings*`

## Notas de modelado

- Los wrappers genéricos (`ApiResponse<T>`, `PageResponse<T>`) se materializan en el OpenAPI
  como schemas concretos por tipo (ej. `ApiResponseProductResponse`, `PageResponseProductListResponse`)
  porque springdoc no soporta genéricos reales. En el frontend seguimos usando un `ApiResponse<T>`
  y `PageResponse<T>` genéricos propios (`src/api/client.ts`) y tipamos `T` con los schemas
  concretos generados en `src/api/openapi.gen.d.ts`.

## Colisión de esquemas: Rating de catálogo vs. Rating de recetas (Fase 3)

`catalog.web.RatingDtos.kt` y `recipes.web.RatingDtos.kt` definen clases Kotlin con el **mismo
nombre simple** (`RatingResponse`, `RatingStatsResponse`, `CreateRatingRequest`,
`UpdateRatingRequest`) en paquetes distintos. Springdoc genera el nombre del schema OpenAPI a
partir del nombre simple de la clase, así que ambos módulos colapsan al mismo schema y **solo una
versión sobrevive** en `openapi.gen.d.ts` (la de `recipes`, con campos `userName`, `madeRecipe`,
sin `title`, sin `verifiedPurchase`, sin `helpfulCount`, sin `productId`).

Esto significa que los tipos `RatingResponse` / `RatingStatsResponse` / `CreateRatingRequest`
re-exportados en `src/api/schema.ts` **no representan el contrato real** de
`/api/v1/products/{productId}/ratings*` (el de catálogo). Confirmado leyendo directamente
`catalog/web/RatingDtos.kt`:

```kotlin
// catalog — real, usado por ProductController/RatingController
data class RatingResponse(id, productId, userId, rating, title?, comment?, verifiedPurchase, helpfulCount, createdAt, updatedAt)
data class RatingStatsResponse(totalRatings, averageRating?, fiveStarCount..oneStarCount, fiveStarPercentage..oneStarPercentage)
data class CreateRatingRequest(rating: Int (1..5), title?: String (max 100), comment?: String (max 1000))
```

**Decisión (Fase 3)**: en `src/api/catalog.ts` se declaran manualmente `ProductRatingResponse`,
`ProductRatingStatsResponse` y `CreateProductRatingRequest` con estos campos verificados,
en vez de usar los alias de `src/api/schema.ts` para Rating. No se modifica el backend; esto
requeriría anotar una de las dos clases con `@Schema(name = "...")` en Kotlin, fuera del alcance
de esta fase (front-end only). Queda como fix pendiente y de bajo riesgo para el backend.

## Falta el nombre del autor en las reseñas de producto

`catalog.web.RatingDtos.RatingResponse` solo expone `userId` (no `userName`, a diferencia de la
versión de `recipes`). La UI de reseñas de producto (`/tienda/:slug`) no puede mostrar el nombre
real de quien calificó. Decisión: se muestra `Usuario #<userId>`, o `Tú` cuando
`userId === user.id` de la sesión actual. Si el backend agrega `userName` a
`catalog.web.RatingDtos.RatingResponse`, se puede reemplazar sin romper el contrato.

## Sin endpoint de rango de precios del catálogo

No hay un endpoint que devuelva el precio mínimo/máximo real de los productos activos para
calibrar el slider de precio de `/tienda`. Se usa un rango fijo razonable (`0` a `100.000` COP)
como límites del slider; el usuario puede escribir un valor mayor manualmente si lo necesita.
