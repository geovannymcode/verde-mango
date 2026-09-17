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

## Fase 5 — Auth robusta: bugs encontrados en el trabajo de la Fase 4

Al revisar el código escrito en la Fase 4 se encontraron varios bugs reales (no gaps del backend)
que se corrigieron en esta fase:

- **`ApiErrorBody.errors` tenía el tipo equivocado**: se declaraba como `Record<string, string>`,
  pero `GlobalExceptionHandler`/`ErrorResponse.kt` (backend) manda `errors: List<FieldError>` donde
  `FieldError = { field, message, rejectedValue? }` — un **array**, no un mapa. `ApiError` en
  `src/api/types.ts` ahora recibe `FieldError[]` y colapsa el primer mensaje por campo a
  `fieldErrors: Record<string, string>` para usarlo con `setError` de React Hook Form en
  `LoginPage`/`RegisterPage`.
- **Clave de `localStorage` inconsistente**: `src/lib/storage.ts` usaba `'vm.refreshToken'` (con
  punto), fuera de la convención `vm_*` del resto del proyecto (`vm_cart_session`). Se corrigió a
  `'vm_refresh_token'`.
- **El refresh silencioso borraba el usuario de sesión**: `refreshAccessToken()` en
  `src/api/client.ts` llamaba `setSession(accessToken, refreshToken)` sin `user`, y como
  `setSession` sobreescribía `user: null` por defecto, cualquier refresh (al recargar la página o
  tras un 401) dejaba al usuario "logueado" pero sin datos de perfil en el store. Se separó
  `setSession` (login/register, con `user` obligatorio) de `updateTokens` (solo rota tokens, nunca
  toca `user`).
- **No había estado explícito de "restaurando sesión"**: antes se usaba
  `isAuthenticated: boolean` inicializado en `false`, así que durante el primer render (antes de
  que `useAuthBootstrap` resolviera el refresh) cualquier ruta protegida veía `false` y podía
  redirigir a `/login` a un usuario que sí tenía sesión válida. Se reemplazó por
  `status: 'loading' | 'authenticated' | 'anonymous'` en `useAuthStore`, y `App.tsx` muestra un
  `SplashScreen` mientras `status === 'loading'`.
- **Logout no limpiaba la caché de React Query**: `useLogout` solo invalidaba queries; datos de
  otro usuario (perfil, pedidos) podían seguir en caché y aparecer brevemente si alguien iniciaba
  sesión con otra cuenta en la misma pestaña. Ahora hace `queryClient.clear()` y redirige a `/`.
- **`RequireAuth` no soportaba volver a la página original tras iniciar sesión** de forma robusta
  (dependía de `location.state`, que se pierde si el usuario llega por link directo o si el 401
  ocurre en medio de una navegación). Se reemplazó por `ProtectedRoute` + `resolveReturnTo`/
  `buildLoginRedirect` (`src/lib/returnTo.ts`), que usan el query param `?returnTo=`, validando que
  sea una ruta interna (anti open-redirect).

## Fase 5 — Gaps reales del backend (no se pueden arreglar solo en el frontend)

- **No existe endpoint para actualizar el perfil**: `auth/web/Dtos.kt` define
  `UpdateProfileRequest`, pero ningún `@RestController` lo expone (`AuthController` solo tiene
  `register, login, refresh, logout, me`). `src/api/auth.ts#updateProfile` y
  `useUpdateProfile` quedan implementados contra `PATCH /api/v1/auth/me` como la ruta más probable,
  pero **no se puede probar contra el backend actual** (siempre 404). La UI de `/cuenta` (
  `ProfilePage`) es de solo lectura con un aviso explícito hasta que el endpoint exista.
- **`AuthService.logout` revoca TODOS los refresh tokens del usuario**, no solo el de la sesión/
  dispositivo actual (no hay concepto de "cerrar sesión en este dispositivo" vs. "en todos"). Se
  documenta como comportamiento esperado: cerrar sesión en un dispositivo cierra sesión en todos.
- **`GET /api/v1/orders/{orderNumber}` devuelve 404 tanto si la orden no existe como si pertenece a
  otro usuario** (`OrderService.getUserOrder` filtra por `userId` sin distinguir "not found" de
  "forbidden"). `OrderDetailPage` no puede mostrar un mensaje distinto para cada caso; ambos
  renderizan `NotFoundPage`.
- **`OrderStatusHistoryResponse` no incluye un label traducido** para `toStatus`/`fromStatus` (solo
  el enum crudo). `OrderDetailPage` mantiene un mapa local `STATUS_LABELS` que espeja
  `OrderStatus.toLabel()` del backend (usado hoy solo para el `statusLabel` de la orden completa,
  no por entrada del historial); si el backend cambia esos labels hay que sincronizar a mano.


## Fase 6 — Recetas: contrato revisado y límites

Revisión del 2026-09-16 antes de implementar: se intentó consultar
`http://localhost:8080/api-docs` dos veces (también con permiso de red), pero no había un
servidor accesible. Se contrastó la exportación `frontend/openapi/verde-mango-openapi.json`
con los controladores, DTOs y servicios Kotlin actuales. Pendiente validar contra el backend
arrancado; no se presenta esta revisión estática como una prueba de integración en vivo.

### Contrato consumido

Todas las respuestas vienen envueltas en `ApiResponse<T>`.

- `GET /api/v1/recipes?page=0&size=12` → `PageResponse<RecipeListResponse>`.
- `GET /api/v1/recipes/search?search=&category=&tag=&difficulty=&maxTime=&page=0&size=12`
  → `PageResponse<RecipeListResponse>`. Category y tag son slugs; difficulty admite
  `EASY | MEDIUM | HARD`; maxTime es entero. La URL pública usa `categoria`, `tag`,
  `dificultad`, `q`, `page` (base 1), traducidos a los parámetros del backend (page base 0).
- `GET /api/v1/recipes/{slug}` → `RecipeResponse`. El detalle público se resuelve por slug;
  el acceso por id es administrativo.
- `GET /api/v1/recipes/categories` → `CategoryResponse[]` de recetas.
- `GET /api/v1/recipes/tags` → `TagResponse[]`.
- `GET /api/v1/recipes/latest?limit=6` → `RecipeListResponse[]`.
- `GET /api/v1/recipes/{slug}/related?limit=4` → `RecipeListResponse[]`.
- `GET /api/v1/recipes/{recipeSlug}/ratings?page=0&size=10` → `PageResponse<RatingResponse>`.
- `GET /api/v1/recipes/{recipeSlug}/ratings/stats` → `{ averageRating, totalRatings, distribution }`.
- `POST /api/v1/recipes/{recipeSlug}/ratings` (autenticado) con
  `{ rating: entero 1..5, comment?: string (máximo 2000), madeRecipe: boolean }`
  → `RatingResponse`, HTTP 201. Incluye `id, userId, userName?, rating, comment?, madeRecipe, createdAt`.
- `GET /api/v1/products/id/{id}` → `ProductResponse`, para los ingredientes vinculados.
  ProductCard reutiliza el flujo existente de `POST /api/v1/cart/items`.

### Filtros combinados: limitación real del backend

Aunque `/search` acepta todos los filtros, `RecipeService.searchRecipes` utiliza un `when`
excluyente: si hay search ignora categoría/tag/dificultad; si hay categoría ignora tag y
 dificultad; si hay tag ignora dificultad. Solo sin esos tres aplica difficulty/maxTime.
El frontend transmite los parámetros elegidos y avisa cuando se combinan. No filtra únicamente
la página recibida ni inventa totales. Para completar la intersección real se requiere modificar
la consulta de backend y validar su paginación. No se modifica el backend en esta fase.

### Estructuras y relación con catálogo

- `steps[]`: `id, stepNumber, instruction, imageUrl?, tip?, estimatedTime?`; se ordenan por
  stepNumber. Las instrucciones se muestran como texto, no HTML.
- `ingredients[]`: `id, name, quantity?, unit?, preparationNotes?, ingredientGroup?, optional,
  formatted, productId?, productName?, productSlug?, isLinkedToProduct`. Se conserva el orden
  del backend; el DTO no expone displayOrder. Los checks son locales y se reinician al cambiar
  de receta. **Sí existe relación con catálogo mediante productId**: se consultan ids únicos
  por el endpoint público de producto. No hace falta inventar un endpoint receta/productos.
- `nutrition` es opcional: `calories?, proteinGrams?, carbsGrams?, fatGrams?, fiberGrams?`.
  Se oculta si no hay datos y se omiten métricas nulas, sin convertirlas en cero. El contrato
  no indica si los valores son por porción o por receta; no se inventa esa unidad de referencia.
- `publishedAt`, `authorName`, imagen y categoría pueden faltar. No se inventan fechas ni
  autores; en detalle se usa createdAt si falta publishedAt.
- Relacionadas se calculan **solo por categoría** en RecipeService; sin categoría retorna [].
  No hay fallback por tag en el backend actual.
- Se reutilizan los tipos generados. La colisión previa de nombres Rating/Category entre
  catálogo y recetas sigue pendiente; los schemas actuales usados aquí corresponden a recetas.
- No se insertan categorías fijas: se muestran las que devuelve la API, incluyendo Almuerzo,
  Desayuno y Ensaladas si existen en los datos.

### Pendientes posteriores

Arrancar el backend y validar listado/búsqueda, filtros combinados tras su corrección,
ratings autenticados y productos vinculados. Aclarar base nutricional, corregir nombres de
schemas OpenAPI y mantener vigente la exportación. El alcance funcional de Fase 7 no está
especificado en esta solicitud; los pendientes de pagos reales y administración continúan.

Nota adicional de nutrición: `Recipe.hasNutritionInfo` solo comprueba calorías o proteínas. Si únicamente hay carbohidratos, grasas o fibra, el backend envía `nutrition = null`; el frontend no puede recuperar esos valores. Pendiente corregir esa condición en backend.

## Fase 7 — Nosotros y Contáctenos

### Contacto: no existe endpoint

Se intentó consultar `http://localhost:8080/api-docs` antes de escribir código, también con
permiso de red. El servidor no respondió. La exportación OpenAPI local y los controladores
actuales de auth/catalog/orders/payment/recipes no incluyen contacto, mensajes ni consultas.
No hay DTO ni contrato de envío que podamos consumir. Falta verificar el OpenAPI en vivo.

`frontend/src/api/contact.ts` concentra el schema Zod, el tipo `ContactFormValues`, el estado
`contactAvailability` y la única función `sendContactMessage`. No se inventó una ruta, no se
realiza ninguna petición y no hay éxito simulado en la aplicación. Tras validar, devuelve
`ContactError` con código `unavailable`; la página lo muestra mediante el Toast existente y
conserva el texto escrito. Para conectar el backend se cambia este único archivo: mapear el DTO,
hacer la petición, resolver únicamente cuando el backend confirme éxito y activar disponibilidad.

Campos locales (no son un DTO backend): fullName, email, subject, comments; website es honeypot
y renderedAt es el timestamp de montaje. Nombre completo de 3–120 caracteres, email válido
hasta 254, asunto de 3–150 y comentarios de 10–3000. Honeypot no vacío se rechaza; menos de
2 segundos o timestamp futuro también. La protección es básica y el cliente se puede eludir:
el endpoint futuro deberá validar y limitar envíos en servidor. No hay captcha.

### Datos editables y ubicación

- `frontend/src/lib/content/about.ts`: hero, cuatro hitos tipados y tres perfiles tipados.
  TODO: historia/fechas definitivas; nombres, cargos, fotografías y redes reales del equipo.
  El año 1998 proviene del diseño solicitado; los demás hitos no tienen fechas inventadas.
  Los retratos son fotos ilustrativas de Pexels, indicadas como tales y con source URL en datos.
- `frontend/src/lib/content/contact.ts`: dirección, teléfono, email, redes y mapa.
  Dirección confirmada por el usuario: Calle 112 # 43 - 123, Alameda del Río, Barranquilla, Colombia.
  El iframe consulta esa dirección en Google Maps, tiene title descriptivo, loading lazy y altura
  fija. TODO: verificar el pin devuelto por Google o proporcionar embed oficial del negocio.
  TODO: completar teléfono +57, email y las cuatro URLs oficiales. Los enlaces de contacto
  nuevos no usan destinos ficticios #. Hay enlace externo al mapa como alternativa al iframe.
- Ruta canónica `/contactenos`; `/contacto` redirige por compatibilidad. Header, Footer y menú
  móvil enlazan a la ruta nueva.

### Metadatos y siguientes fases

`useDocumentTitle` usa document.title y una única meta description. Se aplicó a todas las
páginas de entrada de fases anteriores, además de Nosotros y Contáctenos; producto y receta
usan el nombre/descripción real tras cargar datos. Son metadatos cliente de una SPA; no hay SSR.

Fase 8 todavía no tiene alcance definido en esta solicitud. Pendientes: endpoint de contacto,
contenido definitivo del equipo/historia y datos de contacto restantes. Se conservan los gaps
previos de Wompi, administración y filtros combinados de recetas.


Verificación Fase 7: build correcto, 27 pruebas (11 nuevas), ESLint sin errores (advertencia
previa de checkout) y diff sin errores de whitespace. Ambas páginas comprobadas a 375, 768 y
1440 px sin desbordamiento horizontal; equipo 1/2/3 columnas y timeline vertical/horizontal.
Las tres fotos cargaron. El iframe de Maps permaneció vacío en el navegador de prueba; su URL
respondió HTTP 200. No se confirmó visualmente el pin; se dejó enlace alternativo a Maps con
la misma dirección. Esta limitación no impide consultar la dirección ni usar el formulario.


## Fase 8 — Auditoría previa al panel (8a)

Se intentó acceder a `/api-docs` en localhost:8080 antes de escribir código y con permiso de red; no respondió. Se contrastaron la exportación OpenAPI local y los controladores/servicios/dominio actuales. No equivale a verificación de integración en vivo.

### Inventario completo de endpoints administrativos

Todas las respuestas tienen wrapper ApiResponse. Los POST de creación devuelven 201 en Kotlin, aunque la exportación los describe como 200.

| Método y ruta | Parámetros / body JSON | Respuesta (schema OpenAPI) |
|---|---|---|
| `POST /api/v1/admin/categories` | — · body `CreateCategoryRequest` | `ApiResponseCategoryResponse` |
| `POST /api/v1/admin/categories/reorder` | — · body `ReorderCategoriesRequest` | `ApiResponse` |
| `GET /api/v1/admin/categories/{id}` | — | `ApiResponseCategoryResponse` |
| `PUT /api/v1/admin/categories/{id}` | — · body `UpdateCategoryRequest` | `ApiResponseCategoryResponse` |
| `DELETE /api/v1/admin/categories/{id}` | — | `ApiResponse` |
| `GET /api/v1/admin/orders` | status, userId, search, fromDate, toDate, page, size | `ApiResponsePageResponseOrderListResponse` |
| `GET /api/v1/admin/orders/stats` | fromDate, toDate | `ApiResponseOrderStatsResponse` |
| `GET /api/v1/admin/orders/{id}` | — | `ApiResponseOrderResponse` |
| `PATCH /api/v1/admin/orders/{id}/status` | — · body `UpdateOrderStatusRequest` | `ApiResponseOrderResponse` |
| `POST /api/v1/admin/products` | — · body `CreateProductRequest` | `ApiResponseProductResponse` |
| `PUT /api/v1/admin/products/{id}` | — · body `UpdateProductRequest` | `ApiResponseProductResponse` |
| `DELETE /api/v1/admin/products/{id}` | — | `ApiResponse` |
| `PATCH /api/v1/admin/products/{id}/featured` | featured | `ApiResponse` |
| `POST /api/v1/admin/products/{id}/images` | — · body `AddProductImageRequest` | `ApiResponseProductImageResponse` |
| `DELETE /api/v1/admin/products/{id}/images/{imageId}` | — | `ApiResponse` |
| `PATCH /api/v1/admin/products/{id}/images/{imageId}/primary` | — | `ApiResponse` |
| `PATCH /api/v1/admin/products/{id}/stock` | — · body `UpdateStockRequest` | `ApiResponseProductResponse` |
| `GET /api/v1/admin/recipes` | status, search, page, size | `ApiResponsePageResponseRecipeListResponse` |
| `POST /api/v1/admin/recipes` | — · body `CreateRecipeRequest` | `ApiResponseRecipeResponse` |
| `POST /api/v1/admin/recipes/categories` | — · body `CreateCategoryRequest` | `ApiResponseCategoryResponse` |
| `PUT /api/v1/admin/recipes/categories/{id}` | — · body `UpdateCategoryRequest` | `ApiResponseCategoryResponse` |
| `DELETE /api/v1/admin/recipes/categories/{id}` | — | `ApiResponseUnit` |
| `PATCH /api/v1/admin/recipes/categories/{id}/toggle-active` | — | `ApiResponseCategoryResponse` |
| `GET /api/v1/admin/recipes/{id}` | — | `ApiResponseRecipeResponse` |
| `PUT /api/v1/admin/recipes/{id}` | — · body `UpdateRecipeRequest` | `ApiResponseRecipeResponse` |
| `DELETE /api/v1/admin/recipes/{id}` | — | `ApiResponseUnit` |
| `PATCH /api/v1/admin/recipes/{id}/feature` | featured | `ApiResponseRecipeResponse` |
| `PATCH /api/v1/admin/recipes/{id}/publish` | — | `ApiResponseRecipeResponse` |
| `PATCH /api/v1/admin/recipes/{id}/unpublish` | — | `ApiResponseRecipeResponse` |


### Gaps que afectan las siguientes subentregas

- No existe upload multipart/base64 ni endpoint de almacenamiento de archivos. Producto recibe
  `imageUrls[]` al crear y `AddProductImageRequest {url, altText?, isPrimary}` al agregar;
  categoría usa imageUrl; receta usa primaryImageUrl y steps[].imageUrl. ImageUploader en 8a
  degrada a URLs HTTP(S), preview, eliminar y reordenar localmente. No se puede verificar el
  peso/MIME de un archivo remoto de forma fiable sin descargarlo/CORS; no se promete esa validación.
  Producto permite cambiar primaria y borrar imágenes, pero no guardar el orden completo de las
  existentes. Los movimientos del componente son locales hasta su integración en 8b.
- No hay `GET /admin/products` ni `GET /admin/products/{id}`. Lecturas reales: `GET /products`
  (page, size, category, minPrice, maxPrice, inStock, search, sortBy, sortDir) y `/products/id/{id}`.
  El listado fuerza active=true, sin filtro de inactivos ni total global. Dashboard usa size=1 y
  totalElements con etiqueta **Productos activos**; no simula un total administrativo.
- No hay `GET /admin/categories` paginado ni listado de inactivas. `/categories` devuelve activas,
  `/admin/categories/{id}` sí existe. Slug y sortOrder existen en DTO Kotlin de catálogo, pero
  CreateCategoryRequest/UpdateCategoryRequest/CategoryResponse colisionan con recetas en OpenAPI:
  la exportación contiene displayOrder/recipeCount de recetas. Resolver nombres de schemas y
  regenerar tipos antes de construir 8b con tipado fiel a OpenAPI.
- `DELETE /admin/products/{id}` desactiva (soft delete), sin comprobación de referencias de órdenes.
  `DELETE /admin/categories/{id}` desactiva también descendientes y no bloquea por productos.
  La UI futura no debe describir estos endpoints como borrado físico.
- `/admin/orders` filtra status/userId/search/fromDate/toDate y pagina. Search busca número/email;
  fechas son instantes ISO. Orden fijo createdAt DESC, sin parámetro de ordenación. DataTable
  acepta ordenación controlada para endpoints que la soporten; dashboard no presenta sort ficticio.
- OrderListResponse no incluye cliente/email ni paymentStatus; tiene paidAt. OrderResponse sí
  tiene destinatario/dirección, paymentMethod/paymentReference/paidAt, ítems e historial, pero no
  userEmail, paymentId ni detalles completos de transacción Wompi. No deducir estado de pasarela
  de un estado de orden. El proveedor de pagos continúa simulado en el backend.
- `/admin/orders/stats` devuelve totalOrders, pendingOrders, processingOrders, deliveredOrders,
  cancelledOrders, totalRevenue y averageOrderValue. Los conteos y promedio son históricos; solo
  totalRevenue usa fromDate/toDate (30 días por defecto). Para CONFIRMED/SHIPPED/REFUNDED, 8a
  consulta `/admin/orders?status=...&page=0&size=1` y usa totalElements. No hace sumas de una página.
- Recetas: listado admin solo admite status/search/page/size, sin categoría/dificultad/tag.
  RecipeListResponse tampoco devuelve status, aunque RecipeResponse sí. No inventar estado
  publicado de cada fila. Create/UpdateRecipeRequest no aceptan slug: backend lo genera a partir
  del título (también al editar). description sirve como extracto; no existe campo excerpt separado.
  Pasos/ingredientes son arrays reemplazables con PUT, con stepNumber/displayOrder. Nutrición
  opcional son campos planos (calories/proteinGrams/carbsGrams/fatGrams/fiberGrams). Los null de
  actualización se ignoran, así que limpiar nutrición existente no está soportado completamente.
  Crear genera DRAFT; publish/unpublish son PATCH independientes. Publicar requiere ingredientes
  y pasos. Tags solo tienen lectura pública, no CRUD administrativo expuesto.
- Permisos backend: SecurityConfig exige hasRole('ADMIN') en /api/v1/admin/**, aunque los
  controladores admiten SUPER_ADMIN. JwtAuthenticationFilter otorga solo el rol del token, sin
  jerarquía. AdminRoute seguirá admitiendo ambos, pero SUPER_ADMIN puede recibir 403 real. Se
  muestra mensaje de permisos explícito; no se modifica backend ni se elude autorización.

### Transiciones reales de órdenes (Constants.kt + OrderService)

| Estado actual | Destinos permitidos |
|---|---|
| PENDING | CONFIRMED, CANCELLED |
| CONFIRMED | PROCESSING, CANCELLED |
| PROCESSING | SHIPPED, CANCELLED |
| SHIPPED | DELIVERED, CANCELLED |
| DELIVERED | REFUNDED |
| CANCELLED | Ninguno |
| REFUNDED | Ninguno |

PATCH /admin/orders/{id}/status recibe `{status, comment?, trackingNumber?, carrier?}`.
SHIPPED y DELIVERED usan métodos especiales que generan su comentario, ignorando comment recibido.
CONFIRMED marca paidAt aun cuando el cambio es manual. REFUNDED por este PATCH cambia el estado,
pero no ejecuta un reembolso en Wompi ni recibe importe; no presentarlo como movimiento de dinero.
No hay endpoint para obtener dinámicamente transiciones ni DELETE de órdenes. Transición inválida
se rechaza con check; la traducción HTTP depende del GlobalExceptionHandler, no del enum OpenAPI.

### Alcance 8a

Shell independiente protegido por AdminRoute, dashboard y componentes base. Navegación de las
secciones posteriores visible pero deshabilitada con su subentrega; no se crean CRUD ni rutas
que aparenten estar listas antes de revisión. Mutaciones de negocio e invalidación pública se
conectarán en 8b–8d. FormShell prepara protección de navegación; helper común mapea 403 y errores
por campo. Pruebas/preview pueden usar fixtures aisladas, nunca un bypass en la aplicación.
