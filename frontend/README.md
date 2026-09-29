# Verde Mango — Frontend

Sitio público y panel de administración en React 19, TypeScript estricto, Vite 8, React Router, TanStack Query, Zustand y Tailwind 4. Aplicación npm independiente del backend Kotlin/Gradle.

**Estado de entrega:** build y pruebas frontend disponibles; **no habilitado para cobrar dinero real**. El backend de pagos aún simula confirmaciones y checkout devuelve `paymentUrl=null`. Contacto tampoco envía mensajes. Consulta [gaps de API](../docs/api-gaps.md), [backlog](../docs/backlog.md) y [despliegue](../docs/despliegue.md).

## Requisitos e instalación

- Node **22.12 o superior de la rama 22** recomendado; verificado con 22.16.0. Vite admite `^20.19.0 || >=22.12.0`; Node 20.0 no basta.
- npm **11** (verificado 11.4.2), con `package-lock.json` versionado.
- Para datos reales: Java 25 mediante SDKMAN, Docker Desktop abierto y backend de este repositorio. Los tests frontend no requieren backend ni Docker.

Desde la raíz, en dos terminales:

```bash
# Terminal 1: backend; Docker debe estar abierto
sdk env
./gradlew :backend:app:bootRun
```

Spring Boot levanta PostgreSQL/Redis con infrastructure/docker-compose.yml. La API escucha en http://localhost:8080; contrato en http://localhost:8080/api-docs y Swagger en http://localhost:8080/swagger-ui.html.

```bash
# Terminal 2: frontend
cd frontend
npm ci
cp .env.example .env.local
npm run dev -- --port 5173 --strictPort
```

Abrir http://localhost:5173. Registrarse en `/registro` crea una cuenta de cliente para probar el flujo. El panel `/admin` exige ADMIN/SUPER_ADMIN; el administrador precargado del backend no tiene una contraseña en texto plano documentada: aprovisionar una credencial propia según la política del entorno, no inventar una contraseña ni elevar roles desde el navegador.

Si el backend usa otro puerto: `API_PROXY_TARGET=http://localhost:8082 npm run dev`. En desarrollo Vite redirige `/api` y `/actuator` al backend. `npm run preview` **no** tiene ese proxy; usa las variables con las que se construyó dist y la estrategia de origen/CORS descrita en despliegue.

## Variables

| Variable                | Qué hace                                                                                                                                               | Desarrollo                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| `VITE_API_BASE_URL`     | Base HTTP de producción, sin `/api` final. Ignorada por el cliente en modo dev, que usa rutas relativas y proxy. Incrustada al compilar.               | `http://localhost:8080`      |
| `VITE_WOMPI_PUBLIC_KEY` | Reservada; se lee en env.ts pero no hay consumidor de widget. No habilita pagos. Solo puede contener llave pública.                                    | Vacía                        |
| `API_PROXY_TARGET`      | Variable del proceso que ejecuta Vite, no del bundle. Destino del proxy dev. Pasarla antes del comando; no confiar en `.env.local` para esta variable. | `http://localhost:8080`      |
| `ANALYZE`               | Activa visualizer, manifest y sourcemaps ocultos en build. El script de análisis la establece.                                                         | Sin definir; `1` al analizar |

Nunca colocar secretos en `VITE_*`. `.env.local` no se versiona. Para mismo origen productivo se puede compilar con `VITE_API_BASE_URL=` (cadena vacía explícita, no omitirla). Cualquier cambio requiere reconstruir dist.

## Comandos

Ejecutar desde frontend/:

```bash
npm test                 # 189 tests: Vitest + Testing Library + MSW v2
npm run test:watch       # desarrollo de tests
npm run test:coverage    # cobertura por carpeta en coverage/, sin umbral artificial
npm run lint            # ESLint
npm run format:check    # Prettier sin escribir
npm run format          # Prettier; revisar el diff antes de commitear
npm run build           # tsc -b y Vite -> dist/
npm run preview         # inspección del build, no servidor de producción
npm run build:analyze   # visualizer y verificación de separación admin/dnd-kit
npm run build           # reconstruir sin sourcemaps antes de publicar
node scripts/audit-production.mjs  # requiere stats del análisis; revisa dist actual
npm run gen:api-types   # backend activo en localhost:8080/api-docs
```

Análisis: `coverage/bundle/stats.html`, `stats.json`, `summary.json`. El script verifica que Home/tienda permanezcan iniciales y que el panel y dnd-kit queden diferidos. No publicar coverage, src/test ni los mapas generados por el análisis. El escáner guarda términos/conteos sin imprimir posibles valores secretos; `token` puede ser un identificador legítimo y necesita revisión, no equivale a una credencial filtrada.

Tests: MSW responde con ApiResponse y PageResponse reales; factories derivadas de OpenAPI. El setup resetea handlers, stores y QueryClient entre casos. Los siete flujos cubren filtros, carrito/rollback, login/fusión, refresh concurrente, checkout/stock, polling y estados admin. Son integración con API simulada, **no certificación de Wompi ni E2E contra Kotlin**. Axe cubre semántica; no sustituye navegador ni lector de pantalla. `src/test/a11y/manual.html` es una entrada de auditoría con fixtures y sesión ficticia, nunca una vía para acceder al backend ni parte del build normal.

## Estructura

```text
public/                 SVG estáticos y fallback de producto.
openapi/                Snapshot del contrato backend; no se consulta en cada build.
scripts/                Análisis de chunks y auditoría de dist.
src/api/                Cliente HTTP, funciones de API y tipos OpenAPI generados.
src/components/ui/      Primitivas accesibles (Button, Rating, Modal, Drawer…).
src/components/layout/  Header, Footer, navegación y CartDrawer.
src/components/catalog/ Tarjetas, filtros, galería y reseñas de productos.
src/components/recipes/ Tarjetas, ingredientes, pasos y sidebar de recetas.
src/components/cart/    Controles compartidos del carrito.
src/components/admin/   Tablas, formularios y confirmaciones del panel.
src/components/auth/    Guards de sesión y roles.
src/components/routing/ Lazy routes, skeletons y recuperación de errores de chunks.
src/features/           Queries, mutations, keys y validaciones por módulo; incluye admin/.
src/hooks/              Hooks compartidos de URL, título, foco y protección de salida.
src/lib/                Entorno, formateo, adaptadores, storage y helpers.
src/lib/content/        Historia, equipo y contacto editables; TODO editoriales explícitos.
src/pages/              Rutas públicas; account/ para cuenta y admin/ para administración.
src/store/              Estado Zustand de autenticación, carrito y UI.
src/types/              Declaraciones auxiliares TypeScript.
src/test/               Setup, utilidades, MSW, flujos críticos y auditorías de accesibilidad.
```

`src/routes.tsx` declara las rutas; `src/main.tsx` inicia la app; `src/index.css` contiene tokens y estilos compartidos. El panel y el formulario de recetas se cargan por separado; Home y tienda permanecen en la carga inicial.

## Contrato y autenticación

Los DTO concretos se generan en `src/api/openapi.gen.d.ts` y se reexportan desde `schema.ts`. `ApiResponse<T>`/`PageResponse<T>` están en `api/types.ts`; `unwrap` en `api/client.ts`. Existe una excepción temporal para ratings de catálogo por colisión de schemas documentada en los gaps.

Access token en memoria, refresh token en localStorage. Refresh concurrente coordinado y returnTo restringido a rutas internas. Carrito invitado usa `X-Session-Id`; la fusión autenticada conserva ese header. El backend sigue siendo responsable de autorización. Logout revoca todos los refresh tokens del usuario.

## Probar una compra y Wompi sandbox

### Qué puede probarse hoy

1. Arrancar los servicios, entrar a `/tienda`, abrir un producto con stock y agregar cantidad.
2. Comprobar contador y Drawer; abrir carrito, iniciar sesión/registrarse y volver a checkout.
3. Completar envío; el frontend valida carrito mediante POST `/api/v1/checkout/validate` y envía POST `/api/v1/checkout`. El DTO incluye `billingSameAsShipping=true`; no solicita facturación duplicada.
4. **Límite actual:** se crea una orden real en la BD de desarrollo, pero no se abre Wompi porque no hay paymentUrl. El backend publica un evento simulado de pago. No repetir el envío como si fuera inocuo ni interpretar la confirmación como cobro.
5. Consultar `/cuenta/ordenes`. Las pruebas automatizadas de redirección usan MSW; no generan pagos.

### Prueba completa cuando el backend cierre el gap de pagos

1. Configurar en el servidor las llaves sandbox auténticas del comercio, firma de integridad y recepción de eventos HTTPS; nunca usar los valores de ejemplo del YAML.
2. El backend debe devolver una URL de checkout válida y vincular transacción con orden. Repetir el flujo anterior hasta redirigir a la pasarela.
3. En el checkout de Wompi usar estas tarjetas de prueba (no tarjetas reales):

| Número                | Resultado esperado |
| --------------------- | ------------------ |
| `4242 4242 4242 4242` | APPROVED           |
| `4111 1111 1111 1111` | DECLINED           |

Fecha futura y CVC de tres dígitos. Fuente: [datos oficiales de sandbox de Wompi Colombia](https://docs.wompi.co/docs/colombia/datos-de-prueba-en-sandbox/), revisada el 28-09-2026.

4. Verificar recepción/autenticidad del evento, actualización persistida e idempotencia ante duplicados. Volver a `/checkout/resultado` con identificación de la orden: hoy la landing exige `reference=orderNumber`. Wompi documenta retorno con `id` de transacción; el backend debe resolver esa relación o preservar la referencia en el redirect. No asumir que Wompi agrega reference/status. [Contrato Web Checkout](https://docs.wompi.co/docs/colombia/widget-checkout-web/).
5. Comprobar aprobado, rechazado y pendiente; consultar estado del servidor, nunca confiar en un status de URL. El polling actual es cada 3s, máximo 10 consultas, con corte final, pausa en background y reinicio solo con «Verificar de nuevo».
6. Validar stock insuficiente y doble clic sin duplicar orden/cobro. No habilitar producción hasta completar también la conciliación cuando el usuario no vuelve al sitio.

El selector CARD/PSE/NEQUI es una adaptación del frontend al paymentMethod libre actual; falta confirmar el contrato de pasarela. La landing actual interpreta estado de orden, que un admin puede cambiar: debe apoyarse en una fuente de pago verificada antes de certificar cobros.

## Naranja y contraste (cierre 9c)

| Uso                                     | Token / utilidad                                    | Regla                                                                                                                                                            |
| --------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Texto pequeño, enlaces, estados activos | `--vm-orange-text: #C73C20` / `text-vm-orange-text` | Mínimo 4.5:1: blanco **5.127:1**, crema **4.700:1**.                                                                                                             |
| Cualquier texto sobre crema             | `--vm-orange-text`                                  | Prohibido el naranja original a cualquier tamaño, incluidos eyebrows, años y texto de marca.                                                                     |
| Texto grande sobre blanco               | `--vm-orange: #FF5B3B` / `text-vm-orange`           | Desde 24px regular o 19px bold (700+): **3.083:1**, mínimo 3:1.                                                                                                  |
| Botón sólido naranja con texto blanco   | `bg-vm-orange`                                      | Texto **19px bold**, también en hover. 16px bold **no** alcanza AA. Si un diseño no admite crecer, usar `bg-vm-orange-text` (5.127:1) y documentar la excepción. |
| Fondos y decoración                     | `--vm-orange`                                       | Se conserva la marca. No reducir opacidad del botón en hover: blanco sobre naranja al 90% cae a 2.806:1.                                                         |

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

## Tipografía y grupos de acciones

Quicksand carga normal 400/500/600/700, todos usados; las clases 800 no cargan una cara adicional. Caveat carga solo 400; la cursiva de la línea de tiempo se sintetiza. `display=swap` y preconnect a Google Fonts permanecen activos. Archivos latinos medidos: 75,39 KiB en total, sin contar CSS/cabeceras; otros subconjuntos dependen del texto.

Para pares de acciones usa `vm-action-group`, y `vm-action-group--stacked` si van apiladas. Iguala alturas con contenido envuelto y conserva mínimo de 48px, también con enlaces envolventes. No restablecer h-11 individual en ese grupo. Ver [corrección V9D5-01](../docs/fix-v9d5-01.md).
