# Verde Mango — Frontend

Frontend web de Verde Mango (fermentos, veg-quesos, frutas, verduras y recetas veganas). Proyecto
npm independiente, hermano del backend Kotlin (`../backend/app`). No forma parte del build de
Gradle.

## Stack

| Área | Tecnología |
|---|---|
| Base | React 19 + TypeScript (strict) + Vite |
| Ruteo | React Router v7 |
| Estado servidor | TanStack Query v5 |
| Estado cliente | Zustand |
| HTTP | Axios (instancia central + interceptores) |
| Estilos | Tailwind CSS v4 |
| Formularios | React Hook Form + Zod |
| Iconos | lucide-react |
| Testing | Vitest + Testing Library |
| Lint/format | ESLint + Prettier |

## Requisitos

- Node.js 20+ (probado con Node 22)
- Backend corriendo en `http://localhost:8080` (levanta Postgres/Redis vía Docker Compose)

## Cómo levantar el proyecto

```bash
# terminal 1 — backend (desde la raíz del repo)
./gradlew :backend:app:bootRun

# terminal 2 — frontend
cd frontend
npm install
npm run dev
```

La app queda en `http://localhost:5173`.

## Variables de entorno

Copia `.env.example` a `.env.local` (este último no se commitea):

```bash
cp .env.example .env.local
```

| Variable | Descripción | Default |
|---|---|---|
| `VITE_API_BASE_URL` | URL base del backend. Solo se usa en el **build de producción**; en desarrollo las peticiones a `/api/**` pasan por el proxy de Vite hacia `http://localhost:8080` (evita problemas de CORS). | `http://localhost:8080` |
| `VITE_WOMPI_PUBLIC_KEY` | Llave pública del widget de Wompi (sandbox). Nunca poner llaves privadas aquí. | — |

## Scripts

```bash
npm run dev             # servidor de desarrollo (Vite)
npm run build           # type-check (tsc -b) + build de producción
npm run preview         # sirve el build de producción localmente
npm run lint            # ESLint
npm run format          # Prettier (escribe)
npm run format:check    # Prettier (solo verifica)
npm run test            # Vitest (una corrida)
npm run test:watch      # Vitest en modo watch
npm run gen:api-types   # regenera src/api/openapi.gen.d.ts desde el OpenAPI real del backend
```

## Contrato con el backend

Todas las respuestas del backend vienen envueltas en:

```ts
type ApiResponse<T> = { success: boolean; message: string | null; data: T }
type PageResponse<T> = { content: T[]; page: number; size: number; totalElements: number; totalPages: number; last: boolean; ... }
```

Estos tipos genéricos y el helper `unwrap<T>()` viven en `src/api/client.ts`. Los tipos concretos
(`ProductResponse`, `OrderResponse`, etc.) **no se escriben a mano**: se generan desde el OpenAPI
real del backend (`http://localhost:8080/api-docs`) con `openapi-typescript` hacia
`src/api/openapi.gen.d.ts`. Re-exports convenientes están en `src/api/schema.ts`.

Para regenerar los tipos después de un cambio en el backend, con el backend corriendo:

```bash
npm run gen:api-types
```

Documentación viva de la API: `http://localhost:8080/swagger-ui.html` y `http://localhost:8080/api-docs`.

Endpoints pedidos por el diseño pero **inexistentes** en el backend actual (ej. favoritos/wishlist)
están documentados en `../docs/api-gaps.md`.

## Autenticación

- Access token en memoria (`src/store/authStore.ts`, Zustand). Refresh token en `localStorage`
  (`src/lib/storage.ts`).
- El interceptor de request (`src/api/client.ts`) agrega `Authorization: Bearer <access>`.
- El interceptor de response, ante un 401, intenta un refresh una sola vez, encola las peticiones
  concurrentes y las reintenta; si el refresh falla, limpia la sesión y redirige a `/login`.

## Estructura

```
frontend/
├── public/
├── openapi/             # copia local del OpenAPI exportado (referencia, no se regenera en build)
├── src/
│   ├── api/             client.ts, types.ts, openapi.gen.d.ts (generado), schema.ts, auth.ts, ...
│   ├── components/
│   │   ├── ui/          Button, Input, Select, Badge, Rating, Pagination, Modal, Drawer, Skeleton, Toast
│   │   ├── layout/      Header, Footer, MobileNav, CartDrawer, SectionTitle
│   │   ├── catalog/     ProductCard, ProductGrid, ProductFilters, PriceRange, ReviewList
│   │   └── recipes/     RecipeCard, RecipeSidebar, IngredientList, StepList
│   ├── features/        hooks de TanStack Query por módulo (auth, catalog, orders, payment, recipes)
│   ├── hooks/
│   ├── pages/
│   ├── store/           authStore.ts, cartStore.ts, uiStore.ts
│   ├── lib/              formatters, validators zod, env, storage, queryClient
│   ├── routes.tsx
│   └── main.tsx
├── .env.example
├── vite.config.ts        proxy /api -> http://localhost:8080, alias @ -> src/
└── vitest.config.ts
```

## Carrito, checkout y pagos (Wompi)

- **Carrito**: invitados se identifican con el header `X-Session-Id` (UUID generado y persistido en
  `localStorage`, ver `src/store/cartStore.ts` y el interceptor en `src/api/client.ts`). Al iniciar
  sesión o registrarse (`src/features/auth/hooks.ts`) se llama automáticamente a
  `POST /api/v1/cart/merge` para fusionar el carrito de invitado con el del usuario.
- **Checkout** (`/checkout`, `src/pages/CheckoutPage.tsx`) requiere sesión iniciada (protegido por
  `src/components/auth/RequireAuth.tsx`, redirige a `/login` y vuelve tras autenticar). Antes de
  mostrar el formulario se valida el carrito con `POST /api/v1/checkout/validate` (stock/precio por
  ítem); si hay errores se muestran y se bloquea el botón de pago.
- **Resultado del pago** (`/checkout/resultado`, `src/pages/CheckoutResultPage.tsx`): lee el query
  param `reference` (el `orderNumber`) y hace *polling* contra `GET /api/v1/orders/{orderNumber}`
  cada 3s mientras el pedido esté en `PENDING`, hasta que quede `CONFIRMED`/`PROCESSING`/etc.
  (aprobado) o `CANCELLED`/`REFUNDED` (rechazado).

**Importante — no probable de punta a punta hoy**: el backend actual (`payment/PaymentApi.kt`) es
un stub que simula el pago y **siempre** devuelve `paymentUrl = null` en la respuesta de
`POST /api/v1/checkout`. No existe `WompiController`/webhook real. El frontend está construido
asumiendo el contrato típico del Web Checkout de Wompi (si `paymentUrl` viene poblado, se hace
`window.location.href = paymentUrl`), pero contra este backend el botón "Pagar con Wompi" siempre
mostrará un error después de crear la orden real. Detalle completo, incluyendo el nombre asumido de
los query params de retorno, en `../docs/api-gaps.md`.

Los "métodos de pago" del selector en `/checkout` (`CARD`, `PSE`, `NEQUI`) son una suposición: el
backend define `paymentMethod` como texto libre sin enum (`orders/web/CheckoutDtos.kt`).

## Notas

- No se usan librerías de componentes pesadas (MUI, Ant, Chakra); los componentes de `ui/` se
  construyen a mano con Tailwind.
- Precios en pesos colombianos: `Intl.NumberFormat('es-CO')`.
- El advisory de seguridad de `react-router` sobre "RSC Mode CSRF" no aplica: este proyecto usa
  el modo declarativo estándar (`createBrowserRouter`), no React Server Components.

## Naranja y contraste (cierre 9c)

| Uso | Token / utilidad | Regla |
| --- | --- | --- |
| Texto pequeño, enlaces, estados activos | `--vm-orange-text: #C73C20` / `text-vm-orange-text` | Mínimo 4.5:1: blanco **5.127:1**, crema **4.700:1**. |
| Cualquier texto sobre crema | `--vm-orange-text` | Prohibido el naranja original a cualquier tamaño, incluidos eyebrows, años y texto de marca. |
| Texto grande sobre blanco | `--vm-orange: #FF5B3B` / `text-vm-orange` | Desde 24px regular o 19px bold (700+): **3.083:1**, mínimo 3:1. |
| Botón sólido naranja con texto blanco | `bg-vm-orange` | Texto **19px bold**, también en hover. 16px bold **no** alcanza AA. Si un diseño no admite crecer, usar `bg-vm-orange-text` (5.127:1) y documentar la excepción. |
| Fondos y decoración | `--vm-orange` | Se conserva la marca. No reducir opacidad del botón en hover: blanco sobre naranja al 90% cae a 2.806:1. |

Aliases Tailwind: `--color-vm-orange` y `--color-vm-orange-text`, definidos en `src/index.css`.
Los sólidos usan altura mínima para admitir texto envuelto sin recortarlo. El hover usa sombra,
sin aclarar el fondo. No hay excepciones de fondo oscuro aplicadas en botones en este cierre.
Los precios ya oscuros (`vm-ink`) se conservan.

Inventario completo de botones, tamaños anteriores y resultantes: [botones-9c.md](../docs/botones-9c.md).
`src/test/a11y/contrast.test.ts` lee los tokens reales y comprueba pares aprobados mediante
luminancia sRGB; no sustituye un examen visual del layout. Axe en jsdom comprueba semántica,
no contraste. Sobre un tinte naranja al 10% en blanco, el texto oscuro alcanza 4.580:1;
sobre ese tinte en crema baja a 4.222:1: no usar esa combinación para texto pequeño.

Persisten hallazgos de la auditoría fuera de estas decisiones (verde/gris, límites de controles,
contador del carrito y números de pasos). El cierre de la subentrega no certifica conformidad AA
de toda la aplicación. Véase el backlog.
