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

## Fase 4 — Carrito y checkout: lo que sí es real

Confirmado leyendo `orders/web/CartController.kt`, `orders/web/CheckoutController.kt`,
`orders/web/OrderController.kt` y sus DTOs/servicios:

- **Identificación de invitado**: header `X-Session-Id` (no query param). Si el request de
  carrito no trae el header y el usuario no está autenticado, el backend genera un UUID nuevo y
  lo devuelve en la respuesta con el mismo header `X-Session-Id`. El frontend debe leerlo y
  persistirlo (ver `CartController.getOrCreateSessionId` / `buildResponseWithSessionId`).
- **Fusión de carrito**: `POST /api/v1/cart/merge`, requiere `Authorization` y lee `X-Session-Id`
  del request. Si no hay header o el carrito de invitado está vacío, retorna el carrito del
  usuario sin error (`CartController.kt:108-123`, `CartService.mergeGuestCart`).
- **Checkout**: `POST /api/v1/checkout/validate` (valida stock/precio por ítem antes de pagar) y
  `POST /api/v1/checkout` (crea la orden). Ambos requieren `Authorization` (`@PreAuthorize("isAuthenticated()")`),
  por lo tanto el checkout **no admite invitados** — hay que iniciar sesión antes.
- **Órdenes**: se consultan por `orderNumber` (string, no por `id` numérico):
  `GET /api/v1/orders/{orderNumber}`, `GET /api/v1/orders`, `POST /api/v1/orders/{orderNumber}/cancel`.

## Fase 4 — No existe integración real con Wompi en el backend (CRÍTICO)

Revisión exhaustiva de `payment/` y `orders/service/CheckoutService.kt`:

- `PaymentApi.createPayment()` (`payment/PaymentApi.kt:21-58`) es un **stub simulado**: genera una
  referencia falsa (`PAY-XXXXXXXX`), publica `PaymentCompletedEvent` **de inmediato** y retorna
  `PaymentResult(paymentUrl = null, status = "COMPLETED")`. Comentario explícito en el código:
  `// TODO: Integrar con proveedor de pagos real (Stripe, MercadoPago, etc.)`.
- `CheckoutResponse.paymentUrl` **siempre es `null`** (`CheckoutService.kt:153-158`). El checkout
  real nunca devuelve URL de Wompi, referencia de transacción, ni firma de integridad.
- El evento de pago se procesa en `TransactionSynchronization.afterCommit()` **dentro del mismo
  request** de `POST /api/v1/checkout`: la orden pasa a `CONFIRMED` (vía `PaymentEventListener` →
  `OrderService.confirmPayment`) **antes** de que el backend responda al front. No hay una espera
  real de confirmación de pago que el frontend deba sondear.
- **No existe `WompiController`, `WompiService`, `WompiClient` ni webhook** en todo el backend.
- El bloque `wompi:` de `application.yaml:107-128` (public-key, integrity-secret, checkout-url,
  `redirect-url: ${FRONTEND_URL:http://localhost:3000}/payment/result`) **no está referenciado por
  ningún `@Value`/`@ConfigurationProperties` en el código Kotlin** — es configuración huérfana.
- Existe la tabla `payments` (migración `V5__payment_tables.sql`, con columnas `checkout_url`,
  `gateway_status`, `gateway_response`) pero **ninguna entidad/repositorio Kotlin la usa**.

**Decisión (con el usuario, 2026-09-07)**: implementar el frontend de la Fase 4 asumiendo un
contrato de Wompi típico (Web Checkout), aunque hoy no se pueda probar de punta a punta contra
este backend:

- Se asume que `CheckoutResponse.paymentUrl` eventualmente vendrá poblado con la URL completa del
  Web Checkout de Wompi (el backend arma la URL y firma con sus llaves; el frontend nunca ve
  `integrity-secret` ni construye la firma).
- Al recibir `paymentUrl`, el frontend hace `window.location.href = paymentUrl` (sin fallback: si
  vuelve `null`, como ocurre hoy, se muestra un error y no se navega a ningún lado — ver
  `CheckoutPage.tsx`).
- Se asume que Wompi redirige de vuelta a `redirect-url` con los query params estándar de su Web
  Checkout: `id` (id de la transacción en Wompi), `env` (opcional) y, para facilitar pruebas
  locales sin pasarela real, además soportamos `reference` y `status` si vienen. **Esto es una
  suposición, no un contrato verificado**: hoy no hay código en el backend que arme esa URL de
  retorno, así que no hay forma de confirmar el nombre exacto de los parámetros hasta que exista
  la integración real.
- La página `/checkout/resultado` **nunca confía solo en el query param `status`**: siempre hace
  polling contra `GET /api/v1/orders/{orderNumber}` (real) para decidir aprobado/rechazado/pendiente,
  usando `reference` (que en nuestro caso es el `orderNumber`) para saber qué orden consultar.
- Ojo: `wompi.redirect-url` en `application.yaml` apunta a `/payment/result`, no a
  `/checkout/resultado` como pide esta fase. Si se implementa Wompi real en el backend, hay que
  alinear esa variable de entorno con la ruta del frontend, o parametrizarla.

**Para probar de punta a punta hoy**: no es posible. El botón de pago en `/checkout` mostrará un
error inmediato porque `paymentUrl` siempre llega `null` desde este backend. El checkout sí crea
la orden real (`POST /api/v1/checkout` funciona), pero el frontend no tiene a dónde redirigir para
"pagar". Queda pendiente para Fase 5 (o antes) implementar `WompiService`/`WompiController` reales
en el backend.

## Fase 4 — Estado de la implementación del frontend

Implementado con el contrato real verificado arriba: `CartPage`, `CartDrawer`, `CheckoutPage`
(guardado con `RequireAuth`, requiere login), `CheckoutResultPage` (`/checkout/resultado`, con
polling a `GET /api/v1/orders/{orderNumber}`), `LoginPage`, `RegisterPage`, `AccountPage` (lista de
pedidos vía `GET /api/v1/orders`). Botones "agregar al carrito" de `ProductCard`,
`ProductListItem` y `ProductDetailPage` conectados a `useAddToCart` con update optimista. Sesión se
restaura al recargar la app vía `refreshToken` persistido (`useAuthBootstrap` en
`src/features/auth/hooks.ts`), ya que el `accessToken` solo vive en memoria.
