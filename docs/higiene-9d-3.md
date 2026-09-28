# Higiene de producción — 9d-3

Cierre: 28 de septiembre de 2026. No se cambiaron componentes ni comportamiento de producción: el `watch()` señalado ya había sido eliminado en 9b. Se añadieron medición reproducible, comprobación del build y pendientes de publicación.

## Logs y debugger en src

Búsqueda recursiva: `console.log`, `console.debug`, `console.warn`, `console.error` y la palabra `debugger`, incluyendo archivos de test.

| Expresión | Resultado |
| --- | --- |
| `console.log` | 0 |
| `console.debug` | 0 |
| `console.warn` | 0 |
| `debugger` | 0 |
| `console.error` | 1: `frontend/src/features/cart/hooks.ts:229` |

Se conserva el error legítimo de la fusión del carrito de invitado: «No se pudo fusionar el carrito de invitado», acompañado del error capturado. Es una rama de recuperación que no interrumpe el login. Los spies de `console.error` de los tests no son llamadas de logging de producción.

## Artefactos examinados

Se ejecutó `npm run build:analyze` para obtener el grafo de módulos; después `npm run build` para examinar el dist normal, sin sourcemaps. El script `frontend/scripts/audit-production.mjs` recorre **todos los archivos de dist/** y guarda solo términos/coincidencias, sin imprimir valores potencialmente secretos, en `coverage/hygiene/production.json`.

El grafo complementa el examen del contenido minificado: no contiene módulos de `src/test`, archivos `.test.*`, MSW, @mswjs, Vitest ni Testing Library. Los archivos de test de esta fase tampoco entran en la compilación productiva.

### MSW, factories y contenido provisional

En dist no aparecen `msw`, `mockServiceWorker`, `setupWorker`, `setupServer`, `makeProduct`, `makeCart`, `fixtureDate`, `audit-only`, `test-access`, `VM-TEST-001`, «Kimchi de prueba» ni «Quinua de prueba». **No se incluyen MSW, sus handlers ni las factories de test.**

Sin embargo, **no está cumplida una ausencia absoluta de datos provisionales**. En el chunk inicial `index-C_9pWl3Q.js` permanecen:

| Contenido presente en dist | Cantidad | Procedencia |
| --- | ---: | --- |
| «Nombre por confirmar» | 3 | Equipo de Nosotros, `src/lib/content/about.ts` |
| «Por confirmar» | 2 | Años de hitos de Nosotros |
| «Teléfono por confirmar» | 1 | `src/lib/content/contact.ts` |
| «Correo por confirmar» | 1 | `src/lib/content/contact.ts` |
| `picsum.photos` | 2 | Fotos provisionales de Home |
| `images.pexels.com` | 3 | Retratos de stock explícitamente ilustrativos |

Además existe `dist/placeholder-product.svg`, referenciado por varios chunks como fallback para imágenes ausentes. Es un recurso deliberado de presentación, no un handler ni una respuesta API simulada. No se retiró: quitarlo rompería ese fallback. Los datos editoriales pendientes se anotaron en backlog para sustituirlos con contenido real aprobado, sin inventarlo.

## Secretos: búsqueda explícita en dist

Se buscaron los siete patrones pedidos, de forma literal y también sin distinguir mayúsculas/minúsculas. Los números siguientes son coincidencias, no credenciales.

| Patrón | Literal exacto | Sin distinguir mayúsculas | Qué apareció |
| --- | ---: | ---: | --- |
| `pub_` | 0 | 0 | Nada |
| `priv_` | 0 | 0 | Nada |
| `prv_` | 0 | 0 | Nada |
| `secret` | 0 | 0 | Nada |
| `api_key` | 0 | 0 | Nada |
| `token` | 2 | 35 | Nombres de estado/autenticación y código de Axios |
| `VITE_` | 0 | 7 | Helper interno minificado `vite__mapDeps`, no variables de entorno |

Distribución de `token`: 31 coincidencias insensibles a mayúsculas en `useDocumentTitle-JRewbkWB.js` y 4 en `index-C_9pWl3Q.js`. Se inspeccionaron sus contextos: `accessToken`, `refreshToken`, `updateTokens`, `vm_refresh_token`, `CancelToken`, `cancelToken`, `withXSRFToken`, `withXsrfToken`, `metaTokens`, `TOKEN` y `token`. Son nombres de campos, almacenamiento y utilidades; **no son valores de tokens de una sesión embebidos**.

### Variables VITE y Wompi

El objeto compilado de configuración contiene exactamente:

- `apiBaseUrl: "http://localhost:8080"`: URL no secreta; es el fallback local y debe configurarse para el despliegue real.
- `wompiPublicKey: ""`: cadena vacía.

En fuente se declaran `VITE_API_BASE_URL` y `VITE_WOMPI_PUBLIC_KEY`. Sus nombres no permanecen literalmente en dist, porque Vite sustituye las referencias durante el build. El prefijo VITE permite exponer valores al cliente y **no debe usarse para secretos**; el hecho de que el nombre desaparezca no demuestra seguridad por sí solo, de ahí la inspección del valor compilado y los prefijos de llave.

**Confirmación explícita: este build no contiene ninguna llave pública ni privada de Wompi.** No hay coincidencias `pub_`, `priv_`, `prv_`; la configuración compilada de Wompi está vacía. Esta conclusión corresponde al build local examinado: repetir el chequeo con el entorno usado en CI/despliegue. El escaneo de patrones no es una prueba universal contra cualquier formato imaginable de secreto.

## Checkout: watch y renders

El commit `8422925` (BUG-9B-04) eliminó `watch` de Checkout y la llamada `watch('billingSameAsShipping')` al retirar la facturación duplicada. **No observaba todo el formulario ni sigue presente hoy**. No corresponde introducir useWatch donde ya no hace falta una suscripción.

El estado actual de Checkout usa inputs registrados no controlados y se suscribe a errores mediante `formState.errors`. No hay advertencia de watch/memoización en el lint actual.

### Instrumentación y mediciones

`src/test/form-renders.test.tsx` cuenta las invocaciones de `useForm` durante render, delegando íntegramente en React Hook Form real. No usa un mock del comportamiento de RHF y no añade contadores a producción. Esto mide renders del componente propietario del formulario, no commits de cualquier hijo ni trabajo de layout del navegador.

Se usan APIs MSW, se espera a que terminen las queries y se escribe con user-event carácter por carácter: dos muestras consecutivas de diez caracteres. Se excluye el montaje, la carga inicial y el foco previo. No se usa StrictMode ni se presentan los resultados como una medición de latencia en móviles.

| Formulario / campo | Muestra 1, renders por tecla | Muestra 2, renders por tecla |
| --- | --- | --- |
| Checkout / destinatario | `[0,0,0,0,0,0,0,0,0,0]` | `[0,0,0,0,0,0,0,0,0,0]` |
| Producto / nombre | `[1,0,0,0,0,0,0,0,0,0]` | `[0,0,0,0,0,0,0,0,0,0]` |
| Receta / título | `[1,0,0,0,0,0,0,0,0,0]` | `[0,0,0,0,0,0,0,0,0,0]` |

En los dos formularios del panel, el primer cambio activa `formState.isDirty`, necesario para la protección de salida. No se repite un render del propietario por cada tecla. Producto observa únicamente `images` con useWatch; receta observa únicamente `nutritionEnabled`. Controllers, cambios de arrays/imágenes, errores tras validar y otras actualizaciones sí pueden renderizar componentes, y no se pretende que todos los escenarios tengan cero renders.

**Antes/después de 9d-3: Checkout sigue en 0 renders del propietario por tecla.** No se aplicó una optimización ficticia ni se atribuye una mejora a esta fase. El código anterior a 8422925 no se ejecutó para producir una comparación histórica inventada. La evidencia actual se guarda en `coverage/performance/form-renders.json` y queda protegida por un test que exige cero en Checkout.

## Backlog y validación

- Registrada con prioridad baja la reubicación de los 2.56 kB de utilidades compartidas bajo carpetas admin. El riesgo es una dependencia administrativa pesada accidental en el futuro, no su peso actual.
- Registrados los placeholders reales del build y la URL local de API pendiente de configuración productiva.
- **189 tests pasan**, incluidos los 186 anteriores y tres pruebas de renders.
- TypeScript y ESLint pasan. Build normal correcto, sin aviso de chunk >500 kB.
- No se inició 9d-4.

Reproducción desde frontend:

```sh
npm run build:analyze
npm run build
node scripts/audit-production.mjs
npm test -- src/test/form-renders.test.tsx
npm test
npm run lint
```
