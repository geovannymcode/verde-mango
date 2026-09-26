# Setup de pruebas de integración (9b)

MSW v2 se ejecuta en Node con `setupServer`, sin service worker ni backend real.
`setup.ts` arranca el servidor una vez por suite y usa `onUnhandledRequest: 'error'`:
una petición sin handler no sale a la red. Los overrides de `server.use(...)` se eliminan
entre tests. No registrar listeners permanentes en un test sin retirarlos.

Los handlers están separados en `msw/handlers/{auth,catalog,orders,payment,recipes}.ts`.
Son respuestas base **estáticas y sin estado compartido**. No emulan filtros, transiciones,
stock, persistencia ni fusión del backend. Los futuros flujos deberán definir sus escenarios
con `server.use`, contar requests y comprobar método, URL, headers/body en el resolver.
Las mutaciones no configuradas deliberadamente fallan como requests sin handler.

`payment.ts` maneja POST /api/v1/checkout: no existe un endpoint de pagos que inventar.
La respuesta base no incluye paymentUrl, como el backend actual. El flujo de checkout podrá
usar `makeCheckout({ paymentUrl: 'https://checkout.wompi.co/...' })` como escenario explícito.
No hay llamadas a Wompi ni una simulación de pago real.

## Tipado

- Factories en `msw/factories.ts`: retornos y overrides derivados directamente de
  `components['schemas']` del OpenAPI generado, sin casts que oculten campos obligatorios.
- `apiResponse` conserva el envelope generado; `pageResponse` conserva los campos de página
  generados y calcula content/totales/flags. La página va dentro de `data`.
- Las factories generan objetos/arrays nuevos por llamada. Overrides son superficiales;
  al reemplazar un objeto anidado, proporcionar el DTO anidado completo.
- Los cambios contractuales incompatibles se detectan con `tsc`; añadir un campo opcional
  compatible no exige modificar fixtures. Vitest solo transpila: ejecutar también el chequeo TS.
- La colisión de ratings de catálogo sigue en api-gaps.md. No se prepararon fixtures con el
  schema de ratings de recetas para fingir que fueran reseñas de producto.

## Providers y aislamiento

```tsx
const { user, queryClient } = renderWithProviders(<Pagina />, {
  initialEntries: ['/tienda?categoria=fermentos'],
})
await user.click(screen.getByRole('button', { name: 'Aplicar' }))
```

Cada render crea QueryClient propio: queries/mutations sin retry y gcTime=0.
MemoryRouter admite initialEntries e initialIndex; user-event se crea con setup por render.
No envolver un RouterProvider dentro del helper: este ya aporta MemoryRouter. Para observar
navegación, montar un probe con useLocation o rutas declarativas con Routes/Route.

Antes de cada test se limpia localStorage/sessionStorage, se restablecen los tres stores de
Zustand (incluidas sus acciones originales) y la URL del documento. Auth empieza en `loading`,
como en producción; para probar una pantalla sin App, configurar `anonymous` o la sesión deseada
antes de renderizar. El helper no borra esa configuración al renderizar de nuevo en el mismo test.

Después de cada test: cleanup de React, cancelación/limpieza de clients registrados y singleton
de aplicación, reset de handlers, restauración de spies/globals/env/timers y stores/storage.
Todos los requests/mutaciones iniciados por el test deben aguardarse: no dejar promesas de
mutaciones pendientes, que QueryClient no puede cancelar automáticamente.

Con fake timers usar `userOptions: { advanceTimers: vi.advanceTimersByTime }`; no usar delay:null
ni esperas arbitrarias. Los tests propios que creen QueryClients fuera del helper conservan su
responsabilidad de limpieza; los 77 existentes mantienen sus assertions.

## Verificación

- `npm test`: suite existente más pruebas de infraestructura en setup.test.tsx.
- `npx tsc --noEmit --incremental false -p tsconfig.app.json`: contratos de factories y código.
- `npm run lint`: reglas estáticas.

**Detención de esta entrega:** no se creó src/test/flows ni se escribieron los siete flujos;
no se calculó cobertura. Requiere revisión del setup antes de continuar.
