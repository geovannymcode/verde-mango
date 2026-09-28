# Fase 9d-1 — medición del bundle, antes de optimizar

Estado: auditoría entregada. No se aplicaron React.lazy, Suspense, división por rutas/chunks, cambios de dependencias de producción ni optimizaciones de assets. Base funcional: commit `1ec3960` (cierre de los cambios autorizados de 9c).

## Resultado principal

**El visitante público descarga el panel completo y dnd-kit desde el primer acceso.** Hay un solo chunk JavaScript, cargado por `dist/index.html`. No existen chunks diferidos para `/admin` ni para sus formularios.

El aviso >500 kB corresponde a `assets/index-CaIwBBIS.js`: **740,307 bytes minificados**, no a un sourcemap ni a una imagen. Su contenido mezcla runtime, librerías y todas las rutas públicas/administrativas. No hay una dependencia única que explique todo el tamaño.

## Reproducción e instrumentación

Desde `frontend/`:

```sh
npm run build:analyze
# genera treemap, datos por módulo y resumen comprimido
npm run build
# confirma después el build ordinario, sin mapas ni visualizer
```

Se instaló `rollup-plugin-visualizer` **7.1.1** como dependencia de desarrollo. `vite.config.ts` lo activa exclusivamente con `ANALYZE=1`. El modo de auditoría genera sourcemaps ocultos para atribuir bytes minificados a cada módulo. El modo normal no genera esos mapas ni los informes.

Artefactos locales, regenerables e ignorados por git:

- `frontend/coverage/bundle/stats.html`: treemap interactivo.
- `frontend/coverage/bundle/stats.json`: atribución de módulos del visualizer.
- `frontend/coverage/bundle/summary.json`: desglose por paquete y tamaños de archivos.

El script `frontend/scripts/summarize-bundle.mjs` agrupa los módulos por paquete y comprime los archivos reales con Node zlib. Ambos builds terminaron correctamente y produjeron los mismos nombres/hash para JS y CSS: la instrumentación no cambió el código entregado. Se ejecutó el build normal al final para dejar `dist/` sin mapas de auditoría.

### Unidades y límites

- kB = 1,000 bytes. Los tamaños por dependencia son **bytes minificados atribuidos mediante sourcemap**, no el tamaño del paquete instalado.
- Gzip: `gzipSync` con nivel predeterminado 6; Brotli: `brotliCompressSync` con opciones predeterminadas. Son tamaños de archivo completo, sin cabeceras HTTP.
- El reporte de consola de Vite usa su propia configuración gzip y muestra 222.27 kB para JS y 9.45 kB para CSS; la tabla siguiente usa de forma consistente Node zlib. No comparar métricas de compresión de configuraciones distintas como si fueran una mejora.
- Visualizer 7 desactiva gzip/Brotli **por módulo** al usar sourcemaps; por eso no se inventan tamaños comprimidos por dependencia ni se suman como ahorro de descarga.
- La atribución suma 737,413 bytes del JS; los 2,894 bytes restantes son código generado/sin atribución. El tamaño definitivo del archivo sigue siendo 740,307 bytes.

## Cada chunk y archivo de estilos

| Archivo | Bytes sin comprimir | Gzip, bytes | Brotli, bytes | Tres dependencias más pesadas |
| --- | ---: | ---: | ---: | --- |
| `assets/index-CaIwBBIS.js` — único chunk JS, inicial | 740,307 | 220,367 | 185,729 | react-dom: 178,697; react-router: 95,004; zod: 65,331 |
| `assets/index-B1K9HX_7.css` — hoja inicial, no chunk JS | 46,515 | 9,356 | 8,000 | No aplica: CSS generado por Tailwind más estilos/tokens de la aplicación; no hay tres paquetes JS atribuibles |
| **Total JS + CSS inicial** | **786,822** | **229,723** | **193,729** | No incluye HTML, imágenes ni fuentes externas |

No hay otros chunks JavaScript. Los SVG copiados de `public/` y el HTML no son chunks de código. El sourcemap de auditoría mide 3,128.31 kB, no se referencia desde el JS y no existe en el build normal final.

## Qué contiene el chunk grande

| Grupo / paquete | Bytes atribuidos | kB |
| --- | ---: | ---: |
| Código de aplicación, todas las rutas y componentes | 211,795 | 211.80 |
| react-dom | 178,697 | 178.70 |
| react-router | 95,004 | 95.00 |
| zod | 65,331 | 65.33 |
| axios | 44,953 | 44.95 |
| react-hook-form | 35,575 | 35.58 |
| @dnd-kit/core | 34,287 | 34.29 |
| @tanstack/query-core | 33,005 | 33.01 |
| lucide-react | 9,979 | 9.98 |
| react | 7,830 | 7.83 |
| @dnd-kit/sortable | 6,422 | 6.42 |
| @tanstack/react-query | 3,807 | 3.81 |
| scheduler | 3,497 | 3.50 |
| @hookform/resolvers | 3,135 | 3.14 |
| @dnd-kit/utilities | 2,974 | 2.97 |
| zustand | 581 | 0.58 |
| @dnd-kit/accessibility | 541 | 0.54 |

Los tres paquetes más grandes suman 339,032 bytes (45.8% del JS). El código propio aporta otro 28.6%. El diagnóstico es **acumulación en una única entrada**, no evidencia suficiente para retirar o sustituir una biblioteca. React DOM y Router también son necesarios para el sitio público; separarlos de archivo no equivale a evitar su descarga.

## Panel administrativo en la entrada pública

`src/routes.tsx` importa estáticamente AdminLayout, DashboardPage, ProductsPage, ProductFormPage, CategoriesPage, OrdersPage, AdminOrderDetailPage, AdminRecipesPage y RecipeFormPage. El guard AdminRoute restringe la navegación/renderizado, pero no interrumpe esos imports ni descarga el código bajo demanda.

Medición dentro del chunk:

- 36 módulos de `src/pages/admin/`, `src/components/admin/` y `src/features/admin/`: **74,741 bytes**.
- APIs `admin.ts`, `adminCatalog.ts`, `adminRecipes.ts`: **1,496 bytes**.
- Total de esos módulos identificados: **76,237 bytes**, sin dependencias. No es una promesa de ahorro íntegro: algunos componentes de `components/admin`, como StatusBadge, también son utilizados por el sitio de cuenta.

Mayores módulos propios del panel:

| Módulo | Bytes |
| --- | ---: |
| `pages/admin/RecipeFormPage.tsx` | 9,734 |
| `pages/admin/AdminOrderDetailPage.tsx` | 6,261 |
| `pages/admin/CategoriesPage.tsx` | 5,845 |
| `features/admin/recipes/form.ts` | 4,785 |
| `pages/admin/ProductFormPage.tsx` | 4,345 |
| `pages/admin/DashboardPage.tsx` | 4,070 |

La separación requerida del panel **todavía no se cumple**. No se ha cambiado en esta auditoría.

## dnd-kit

| Paquete | Bytes atribuidos |
| --- | ---: |
| @dnd-kit/core | 34,287 |
| @dnd-kit/sortable | 6,422 |
| @dnd-kit/utilities | 2,974 |
| @dnd-kit/accessibility | 541 |
| **Total** | **44,224 (44.22 kB; 6.0% del JS)** |

Todos están en `assets/index-CaIwBBIS.js`, sin chunk propio ni diferido. Los imports de aplicación están únicamente en `src/features/admin/recipes/SortableRows.tsx`, usado por el formulario de recetas. Cadena: entrada → rutas → RecipeFormPage → SortableRows → dnd-kit. Un visitante público descarga esos bytes aunque nunca visite `/admin`.

Los módulos identificados del panel más dnd-kit suman 120,461 bytes atribuidos, aproximadamente 16.3% del JS. Esa suma describe procedencia, **no predice el ahorro comprimido** ni contempla redistribución de dependencias compartidas al dividir rutas.

## Warnings observados

- Build normal: aviso de chunk >500 kB, confirmado.
- Solo auditoría: `SOURCEMAP_BROKEN` del transformador de Tailwind para CSS; no usar ese mapa para afirmar tamaños de dependencias CSS. La tabla CSS usa bytes reales del archivo.
- Solo auditoría: aviso de tiempo consumido por visualizer. No afecta el runtime ni el build normal.

## Decisión pendiente

Propuesta para 9d-2, **sin aplicar**: diferir rutas mediante React.lazy/Suspense con skeleton y separar la rama administrativa; comprobar que dnd-kit quede fuera de los imports iniciales. Medir luego con los mismos métodos y comparar archivos/descarga inicial.

No se ejecutaron 9d-3 (higiene y re-renders), 9d-4 (assets) ni 9d-5 (verificación visual). Tampoco se actualizaron bibliotecas de producción, umbrales de warning ni configuración de chunks. Esta entrega se detiene en la medición para autorización del usuario.
