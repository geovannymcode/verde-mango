# Fase 9d-2 — separación por rutas

Implementado con React.lazy y Suspense; sin manualChunks, cambios de librerías de producción ni aumento del umbral de warnings.

## Antes y después

Medición en kB decimales. Gzip Node zlib nivel 6, igual que 9d-1; no mezclar con el gzip de la consola Vite, que utiliza otra configuración.

| Carga inicial | Antes minificado | Después minificado | Antes gzip | Después gzip |
| --- | ---: | ---: | ---: | ---: |
| JavaScript realmente requerido (entrada + imports estáticos) | 740.307 | 601.875 | 220.367 | 182.581 |
| CSS | 46.515 | 46.603 | 9.356 | 9.371 |
| Total JS + CSS | 786.822 | 648.478 | 229.723 | 191.952 |

**JavaScript inicial: −138.432 kB (18.70%) minificado y −37.786 kB (17.15%) gzip.** La reducción no se calcula comparando solo el nuevo archivo index: también se cuenta el compartido de 180.220 kB que importa al arrancar.

Antes había un único chunk JS `index-CaIwBBIS.js` de 740.307 kB / 220.367 kB gzip y una hoja `index-B1K9HX_7.css`. Todos los chunks diferidos de la tabla siguiente estaban dentro de ese archivo, no existían por separado.

| Archivo después | Minificado kB | Gzip kB | Carga |
| --- | ---: | ---: | --- |
| `AdminPages-CMCsSx4N.js` | 49.805 | 13.925 | Diferido |
| `CheckoutPage-BMYBnLev.js` | 5.276 | 1.927 | Diferido |
| `CheckoutResultPage-CWfPPI2_.js` | 4.192 | 1.506 | Diferido |
| `RecipeDetailPage-B73p7VAQ.js` | 12.270 | 4.244 | Diferido |
| `RecipeFormPage-CJC_kcA9.js` | 63.512 | 20.692 | Diferido |
| `clock-UJFlR0vV.js` | 0.169 | 0.169 | Diferido |
| `hooks-CDtkjdhQ.js` | 8.828 | 3.641 | Diferido |
| `index-C_9pWl3Q.js` | 421.655 | 122.023 | Inicial |
| `index-q_xENLj2.css` | 46.603 | 9.371 | Inicial |
| `payment-Pq6U6T-S.js` | 0.258 | 0.212 | Diferido |
| `useDocumentTitle-JRewbkWB.js` | 180.220 | 60.558 | Inicial |

El chunk `useDocumentTitle` tiene ese nombre asignado automáticamente por el bundler: **no es el peso de ese hook**. Contiene dependencias compartidas, principalmente React Router, Axios y TanStack Query. El index contiene React DOM y dependencias usadas en rutas públicas. No hay chunks mayores de 500 kB en el build normal final.

## Qué se difiere

- `AdminPages`: entrada administrativa con layout, dashboard, productos, categorías, órdenes y listado de recetas.
- `RecipeFormPage`: import independiente para crear/editar recetas, con dnd-kit. No se importa desde AdminPages.
- Checkout, resultado del checkout y detalle de receta: cada ruta tiene su propio import dinámico y frontera de carga.
- `hooks`: código compartido por administración/formulario. `payment` y `clock`: pequeños chunks compartidos creados automáticamente.
- Home y CatalogPage siguen en la entrada inicial, como se pidió.

## Verificación del grafo de carga

`npm run build:analyze` genera el manifest solo para la auditoría, atribuye módulos con visualizer, calcula tamaños y ejecuta `scripts/verify-route-chunks.mjs`.

El verificador recorre **imports estáticos transitivos**, no solo nombres de archivos, y falla si:

1. Aparece dnd-kit en la carga inicial.
2. Aparecen páginas administrativas o AdminLayout en la carga inicial.
3. La entrada administrativa importa el formulario de recetas o cualquier paquete dnd-kit.
4. Checkout, resultado o detalle de receta dejan de estar diferidos.
5. Home o CatalogPage dejan de estar en la carga inicial.

Resultado: **todas las comprobaciones pasan**. Los cuatro paquetes dnd-kit están únicamente en `RecipeFormPage`, con 44.020 kB minificados atribuidos tras esta compilación. Visitar administración de órdenes no los descarga.

Matiz de la separación: quedan **2.557 kB atribuidos** bajo carpetas llamadas `admin` en la entrada pública: listeners de sincronización de catálogo/órdenes/recetas, query keys, mapa compartido de estados y StatusBadge. Son utilidades que también consume el sitio público/cuenta; no son pantallas del panel ni arrastran dnd-kit. Se conservaron para no romper la sincronización entre pestañas ni duplicar estados. Por eso se confirma que **las pantallas y layout del panel salieron**, no que haya desaparecido toda ruta de archivo que contenga la palabra admin.

No hace falta introducir un vendor manual para cumplir esta separación ni eliminar el warning. Mover React DOM a otro archivo por sí solo no reduciría la descarga inicial, pues Home y tienda lo necesitan. No se ha añadido esa optimización sin autorización.

## Carga y recuperación de errores

`RouteBoundary` envuelve Suspense con ErrorBoundary. Durante la carga muestra Skeleton existente con `role=status`, nombre accesible y bloques estables; no spinner ni pantalla vacía. Ante rechazo del import muestra un mensaje de conexión/versión y botón «Recargar página», que solicita recarga completa para obtener el HTML con hashes actuales. No intenta reutilizar el Promise rechazado de React.lazy. La frontera se reinicia al cambiar de pathname.

Los guards de autenticación/rol se mantienen por fuera de la carga administrativa o protegida. Las definiciones del router continúan usando el data router, preservando bloqueadores de formularios sin guardar.

## Pruebas y límites

- **186 tests pasan:** los 183 anteriores más skeleton/carga exitosa y dos errores representativos de import dinámico con comprobación del botón de recarga; axe incluido en esos estados.
- 14 casos de la auditoría axe requirieron esperar a que desapareciera el skeleton de la ruta y terminaran sus queries. Era un fallo de sincronización del test, no un cambio de expectativas ni una retirada del lazy.
- ESLint exigió separar declaraciones de componentes lazy de la exportación del router. Se creó `LazyPages.tsx`, sin desactivar reglas.
- TypeScript y ESLint pasan. Build ordinario termina sin el warning >500 kB.
- Los tamaños de red son los archivos realmente requeridos según el manifest, con compresión local; no se presentan como mediciones de latencia de una red real.
- Las excepciones de descarga se prueban con manifest y sourcemaps; los errores de red se simulan en tests con imports rechazados, sin provocar un despliegue defectuoso real.
- Se deja `dist/` del build normal, sin manifest ni sourcemaps de auditoría. Informes en `coverage/bundle/` regenerables.

No se inició 9d-3, 9d-4 ni 9d-5. Esta entrega se detiene para revisión.
