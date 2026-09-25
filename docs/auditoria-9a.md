# Fase 9a — auditoría previa a la limpieza

Fecha de auditoría: 2026-09-25. **Snapshot previo a la limpieza**, conservado como evidencia.
Tras autorización, se aplicaron las correcciones seleccionadas: ver [backlog.md](backlog.md)
y [api-gaps.md](api-gaps.md). Las afirmaciones «sin cambios» de este informe describen la auditoría inicial, no el estado posterior.
Las rutas de archivos de este informe son relativas a la raíz del repositorio.

## Alcance y evidencia

Se inventariaron los 169 archivos de `frontend/src`, se analizaron imports y referencias con
TypeScript, el grafo desde `main.tsx`, patrones repetidos, configuración y dependencias.
Se revisaron los documentos de gaps contra controladores/servicios Kotlin y el OpenAPI activo
consultado en localhost:8082: **66 paths y 95 schemas**, con paths/schemas idénticos al snapshot
versionado. No se regeneraron tipos ni se modificaron fuentes, configuración o dependencias.

Comprobaciones de lectura:

- AST de TypeScript: **0 usos de tipo any**, incluido el archivo generado.
- Búsqueda en src: **0 @ts-ignore, @ts-nocheck y @ts-expect-error**. Los `expect.any(...)` de tests
  son matchers, no escapes del sistema de tipos.
- `tsc --noEmit --incremental false -p tsconfig.app.json`: aprobado; noUnusedLocals y
  noUnusedParameters activos. **0 imports muertos detectados**.
- ESLint: 0 errores, 1 advertencia en `pages/CheckoutPage.tsx:64`, por `watch` de RHF y React
  Compiler. No es un error de tipos ni prueba de fallo funcional.
- Prettier en src: **33 archivos** con diferencias de formato, enumerados al final. Solo check.
- No se ejecutaron las subentregas 9b–9e, ni axe ni análisis de bundle en esta auditoría.

## Lista de hallazgos para decidir

### A01 — Alta: rutas del panel repetidas bajo cuenta pública

`frontend/src/routes.tsx:100` registra `/cuenta/recetas`, `/cuenta/recetas/nueva` y
`/cuenta/recetas/:id/editar` con componentes administrativos, dentro de ProtectedRoute, sin
AdminRoute. Un CUSTOMER autenticado puede entrar a esas pantallas; el backend conserva la
restricción ADMIN/SUPER_ADMIN y rechaza sus operaciones. **No se observó una evasión de la
seguridad del backend**, pero el guard de interfaz es incorrecto y los enlaces apuntan a /admin.
Propuesta pendiente: retirar esas tres rutas accidentales o protegerlas explícitamente si se
quieren conservar como alias. No se ha hecho ninguna de las dos cosas.

### A02 — Baja: tres archivos fuera del grafo de la aplicación

| Archivo bajo frontend/src | Evidencia | Propuesta |
| --- | --- | --- |
| lib/mocks.ts | Sin consumidores; categorías/productos/recetas ficticios de fases iniciales | Eliminar si no se desea conservar como fixtures; no afirmar que estos datos se sirven en producción |
| pages/PlaceholderPage.tsx | Sin import ni ruta | Eliminar |
| components/ui/index.ts | Barrel sin consumidor; los componentes se importan por archivo | Eliminar barrel o adoptar convención; los componentes exportados sí se usan |

Se excluyeron deliberadamente tests/setup y declaraciones de tipos del criterio de archivo
huérfano: son entradas del runner/compilador, no de main.tsx.

### A03 — Baja/media: funciones sin consumidores y código anticipado

- `features/auth/hooks.ts`: `useProfile` y `useUpdateProfile` no se invocan.
- `api/auth.ts`: `refresh` no se invoca; la rotación real vive en `api/client.ts`. No quitar esta
  última ni sustituirla por la función sin consumidores.
- `api/catalog.ts`: `getCategoryMenu` no tiene consumidores.
- `api/auth.ts`: `updateProfile` solo está conectado al hook sin consumidores y llama a un
  **PATCH /auth/me inexistente**. La pantalla actual es de lectura y no lo invoca. Propuesta:
  retirar código anticipado o convertirlo en indisponibilidad controlada, previa decisión.
- `api/schema.ts` tiene alias no consumidos; no son imports muertos ni aumentan el bundle runtime.
  Véase inventario al final. No editar `openapi.gen.d.ts` a mano.
- `env.wompiPublicKey` en `lib/env.ts` no tiene consumidor; el contrato elegido recibe paymentUrl
  firmado por backend. Revisar la variable documental junto a 9e, sin añadir integración ahora.

### A04 — Media: duplicación entre sitio público y panel

No se encontraron dos copias completas de la misma biblioteca de UI: Button, Input, Modal,
Drawer, Skeleton y Badge se reutilizan. Sí hay fragmentos de dominio repetidos:

- `pages/account/OrdersListPage.tsx:13` y `pages/account/OrderDetailPage.tsx:17` duplican
  STATUS_BADGE; el detalle además mantiene STATUS_LABELS y el panel usa `lib/adminStatus.ts`.
  Candidato: centralizar etiquetas/semántica, conservando diferencias deliberadas de colores y
  «Pendiente de pago» frente a «Pendiente».
- Historial de orden renderizado en `pages/account/OrderDetailPage.tsx` y
  `features/admin/orders/OrderTimeline.tsx`. Candidato: base presentacional compartida, dejando
  los metadatos administrativos como variante; no exponer nuevos datos al cliente por reutilizarla.
- `components/ui/Modal.tsx` y `Drawer.tsx`, usados por ambas superficies, repiten efecto de Escape,
  foco inicial, portal/backdrop y cierre. Ya comparten useFocusTrap. Candidato: hook de ciclo de
  overlay; no fusionar sus layouts distintos ni anticipar cambios de accesibilidad de 9c.

### A05 — Media/baja: lógica repetida candidata a extracción

1. `features/admin/catalogSync.ts`, `orders/sync.ts`, `recipes/sync.ts`: mismo transporte por
   storage, UUID, listener y cleanup. Compartir utilidad/hook conservando claves e invalidaciones
   propias; no hace falta convertir toda función en hook.
2. `pages/admin/ProductFormPage.tsx`, `CategoriesPage.tsx`, `RecipeFormPage.tsx`: misma regla de
   slug automático hasta edición manual. `toSlug` ya es común; falta compartir el control manual.
3. `components/catalog/ProductCard.tsx:15` y `ProductListItem.tsx:15`: mismo payload/handler de
   agregar una unidad al carrito. Extraer adaptador o pequeño hook; conservar ambos layouts.
4. `pages/AboutPage.tsx` y `ContactPage.tsx`: mismo render de iconos/enlaces sociales con estado
   deshabilitado. Componente de dominio común candidato.
5. `features/admin/hooks.ts`, `catalogHooks.ts`, `recipes/hooks.ts`: política de retry muy similar.
   Centralizar solo si se conservan las diferencias de 404 y número de intentos.
6. Login/Register y formularios admin repiten aplicación de fieldErrors a RHF. Ya existe
   `lib/adminErrors.ts#applyAdminFormError`; posible utilidad general tipada. Los paths anidados de
   recetas requieren tratamiento adicional; no reemplazarlo mecánicamente.
7. CartPage y CartDrawer repiten presentación de ítems/totales, pero comparten hooks y
   QuantityStepper; candidato de prioridad baja, no duplicación de lógica de persistencia.

No propongo unificar artificialmente hooks de catálogo/recetas ni sus formularios de ratings:
los DTOs, validación, identificadores y políticas de invalidación son distintos. Los filtros URL
públicos/admin **ya comparten useUrlFilters**. Su debounce ligado a location.key no es equivalente
al useDebouncedValue del slider; no eliminar uno solo por similitud nominal.

### A06 — Baja: dependencias

- Las **12 dependencias runtime** tienen imports reales: dnd-kit core/sortable, resolvers,
  TanStack Query, axios, lucide-react, React/ReactDOM, RHF, router, Zod y Zustand.
- `@testing-library/user-event`: instalada y sin imports en los tests actuales. Única candidata
  clara a dependencia directa sin uso actual; recomiendo conservarla para los flujos de 9b.
- `@testing-library/dom` no tiene import directo pero es peer dependency de Testing Library
  React/user-event: **no eliminarla como supuesto sobrante**.
- Las demás devDependencies tienen uso en Vite/Vitest/ESLint/Prettier/generación OpenAPI,
  Tailwind o tipado. jsdom se selecciona por configuración, no por import en src. @types no son
  dependencias runtime. No hay otra eliminación justificada por este análisis.
- No se instaló MSW, axe, visualizer ni herramientas de cobertura: corresponden a entregas futuras.

### A07 — Baja: formato y excepciones de lint

33 archivos requieren formato. `components/catalog/PriceRangeFilter.tsx:44` contiene una
supresión puntual de react-hooks/exhaustive-deps; la intención está comentada. Auditarla con el
flujo de filtros de 9b antes de modificar dependencias del efecto. No es @ts-ignore.
La advertencia de Checkout/watch se puede evaluar con useWatch, pero no se cambió por cuenta propia.

### A08 — Media: restos de desarrollo y pendientes funcionales detectados

- `/dev/status` sigue registrado sin condición DEV y contiene texto «Fase 1 completada».
  No es archivo huérfano: hoy es ruta real. Decidir si retirarla o limitarla a desarrollo (9d).
- `components/layout/Header.tsx`: botón Buscar sin handler ni enlace. Funcionalidad pendiente,
  registrada en backlog; no se implementó buscador global.
- `components/layout/Footer.tsx`: tres enlaces a `#` para web/WhatsApp/correo. Los placeholders
  honestos de contactContent no están unificados con el Footer.
- `components/catalog/ReviewForm.tsx`: reset inmediato tras llamar onSubmit, antes de conocer
  éxito del servidor; podría perder el texto ante error. Registrar corrección, no refactor aplicado.
- `pages/account/OrdersListPage.tsx`: fallo de consulta sin datos cae en «Todavía no tienes
  pedidos»; `OrderDetailPage.tsx` trata cualquier error como NotFound. Separar fallos de red/servidor
  de vacío/404 es una corrección pendiente.
- `features/cart/hooks.ts:229`: un console.error sobre fusión de carrito; no hay console.log en src.
  Evaluar política de logs en 9d, no retirarlo sin decidir cómo se informa el fallo.
- Fusión de carrito en login/register se dispara con mutate sin esperarla; los flujos 9b deben
  comprobar retorno/fusión/concurrencia. No se afirma aquí que la fusión siempre falle.
- La landing de pago interpreta estados de orden como aprobación; el backend permite confirmación
  administrativa sin pasarela. La prueba futura con mocks no debe presentarse como validación Wompi.

Los faltantes y correcciones pendientes se registraron en `docs/backlog.md`; no se implementaron.

## Revisión consolidada de api-gaps.md (propuesta, sin reescribir el historial)

El documento contiene evidencia útil, pero **no está consolidado**: agrega fases al final y deja
arriba afirmaciones caducadas. Esta tabla es la clasificación actual para aprobar su reorganización.

| Estado actual | Contrato/capacidad | Situación comprobada |
| --- | --- | --- |
| Falta | Integración Wompi, webhook y conciliación real | PaymentApi simulado; CheckoutService retorna paymentUrl=null; configuración sin integración |
| Falta | Contacto | Sin endpoint/DTO; sendContactMessage lanza indisponibilidad controlada |
| Falta | Actualizar perfil | Solo GET /auth/me, sin PATCH/PUT; UI solo lectura |
| Falta | Wishlist/favoritos | Sin módulo/endpoints; Header actual no presenta corazón |
| Falta | Subida multipart/almacenamiento | Se aceptan URLs; validación de carga local, no upload real |
| Falta | Orden completo de imágenes existentes de producto | Solo principal y borrado; orden restante determinado por servidor |
| Falta | Rango dinámico de precios | Slider 0–100.000 COP y entrada manual; no endpoint de límites |
| Falta | Duplicar recetas | Acción omitida; no endpoint |
| Falta | CRUD tags | Solo listado/populares público |
| Falta | GET admin categorías de receta incluyendo inactivas | Selector público + conservación de categoría actual |
| Falta | Comprobante/reembolso monetario/detalle admin de cliente | No rutas para esas acciones; REFUNDED solo cambia estado; no URL de comprobante |
| Degradado | Rating de catálogo en OpenAPI | Colisión con recipes persiste; tipos manuales verificados en catalog.ts |
| Degradado | Autor de rating de producto | Solo userId; UI Usuario #id/Tú |
| Degradado | Filtros públicos de recetas combinados | Servicio aplica prioridad search/category/tag; frontend informa limitación |
| Degradado | Nutrición: base de referencia | Sin definición por porción o receta; no inventarla |
| Degradado | Relacionadas de recetas | Por categoría; sin fallback tag |
| Degradado | Pago mostrado en panel | Lee último registro payments si existe; no deduce pago del estado de orden |
| Degradado | Estadísticas de órdenes | Conteos/promedio históricos, ingresos con rango; no uniformar la semántica en UI |
| Degradado | Logout/404 de orden | Logout global de refresh tokens; 404 también para orden ajena, comportamiento contractual |
| Resuelto 8b | Schemas de categorías catálogo/recetas | CatalogCreateCategoryRequest/CatalogUpdateCategoryRequest/CatalogCategoryResponse separados |
| Resuelto 8b | ADMIN/SUPER_ADMIN | Ambos admitidos en seguridad/controladores; no exclusividad superadmin en catálogo |
| Resuelto 8b | Lecturas admin de productos/categorías | Incluyen inactivos; productos filtrados y paginados; categorías lista no paginada |
| Resuelto 8b | Borrado categoría con productos, reordenación | Bloqueo 422 y endpoint reorder existentes |
| Resuelto 8b | IDs de imágenes y sesión del panel | IDs persistidos, principal; principal auth correcto, refresh con jti y serialización |
| Resuelto 8c | Órdenes admin: filtros/orden/datos/pago | Multiestado, pago, sort, cliente e historial ampliados; registro de pago opcional |
| Resuelto 8c | Transiciones/historial/conflicto | Comentario conservado; 409 real y refresh ante conflicto |
| Resuelto 8d | Recetas admin: filtros/estado/slug | categoryId/difficulty combinables; status en filas; slug editable |
| Resuelto 8d | Reemplazo/orden de pasos e ingredientes | Arrays completos, ordinales normalizados y flush de antiguos |
| Resuelto 8d | Nutrición borrable y parcial | replaceNutrition; carbs/fat/fiber solos se devuelven; toggle apagado limpia |
| Ya disponible | Recetas vinculadas a productos | productId + GET products/id/{id}; no falta endpoint receta/productos |

Inconsistencias documentales concretas a limpiar, previa aprobación:

1. Cabecera mantiene 2026-07-25 y 87 schemas; snapshot actual tiene 95.
2. «Todo lo demás ... cubierto 1:1» contradice los gaps posteriores: debe retirarse.
3. Wishlist deja una elección futura; Header actual no implementa ninguna de esas opciones.
4. Fase 6 agrupa Rating/Category como colisión pendiente: Category resuelto, Rating sigue abierto.
5. Fase 6 dice que nutrición solo revisa calorías/proteínas: corregido en 8d.
6. Fases 6/7/8a dicen que falta verificar OpenAPI en vivo: contraste actual realizado; no atribuir
   retrospectivamente una prueba de ratings autenticados a una descarga de contrato.
7. Tabla 8a y pendientes describen falta de GET admin, permisos, DTOs, filtros y estados que ya
   fueron resueltos en 8b–8d; etiquetar como histórico o sustituir con inventario vigente.
8. Pago dice que ningún repositorio usa payments: AdminOrderReadRepository ya lo lee desde 8c;
   sigue faltando la integración que escriba transacciones reales de pasarela.
9. Referencias a Fase 5/7/8 «por definir» y nombres RequireAuth/AccountPage están caducados.
10. Distinguir ausencia de endpoint de comportamiento real: DELETE producto desactiva; no es
    un fallo por no borrar físicamente. Contacto, perfil y Wompi no deben figurar como completados.

Propuesta de estructura: estado vigente (faltantes / degradados / resueltos) al inicio, firmas
actuales y evidencia, y cronología histórica aparte. En 9a se reporta la propuesta; `api-gaps.md`
no se sobrescribió para respetar «yo decido qué se limpia».

## Decisiones sugeridas (sin ejecutar)

- Prioridad: A01 rutas incorrectas; después código anticipado PATCH de perfil y errores UX A08.
- Limpieza mecánica: A02 huérfanos y A07 formato, en cambios separados para revisar fácilmente.
- Refactor opcional: A04/A05, priorizando estados, transporte storage y slug.
- Conservar user-event para 9b; no eliminar tipos internos solo porque carezcan de consumidores externos.
- Aprobar consolidación documental por estado, preservando evidencia histórica.

**Detención:** no se continúa a 9b ni se aplica ninguno de estos cambios sin la decisión del usuario.

## Anexo: archivos con diferencias de formato

- `frontend/src/api/auth.ts`
- `frontend/src/api/catalog.ts`
- `frontend/src/api/orders.ts`
- `frontend/src/api/refresh.test.ts`
- `frontend/src/components/admin/AdminAccess.test.tsx`
- `frontend/src/components/admin/AdminComponents.test.tsx`
- `frontend/src/components/admin/DeleteProductDialog.test.tsx`
- `frontend/src/components/catalog/CatalogToolbar.tsx`
- `frontend/src/components/catalog/CategoryFilterList.tsx`
- `frontend/src/components/catalog/ProductListItem.tsx`
- `frontend/src/components/catalog/ReviewForm.tsx`
- `frontend/src/components/layout/CartDrawer.tsx`
- `frontend/src/features/cart/hooks.ts`
- `frontend/src/features/catalog/hooks.ts`
- `frontend/src/features/catalog/keys.ts`
- `frontend/src/index.css`
- `frontend/src/lib/formatters.ts`
- `frontend/src/lib/mocks.ts`
- `frontend/src/lib/validators.ts`
- `frontend/src/pages/account/OrderDetailPage.tsx`
- `frontend/src/pages/account/OrdersListPage.tsx`
- `frontend/src/pages/CartPage.tsx`
- `frontend/src/pages/CatalogPage.tsx`
- `frontend/src/pages/CheckoutPage.tsx`
- `frontend/src/pages/CheckoutResultPage.tsx`
- `frontend/src/pages/HomePage.tsx`
- `frontend/src/pages/LoginPage.tsx`
- `frontend/src/pages/NotFoundPage.tsx`
- `frontend/src/pages/ProductDetailPage.tsx`
- `frontend/src/pages/RecipeDetailPage.tsx`
- `frontend/src/pages/RecipesPage.tsx`
- `frontend/src/pages/RegisterPage.tsx`
- `frontend/src/pages/SetupStatusPage.tsx`

## Anexo: exports sin consumidor externo

Análisis por símbolo TypeScript, no por coincidencia de texto. **No equivale a código muerto**: los tipos y schemas pueden usarse dentro del propio archivo. `getCurrentUser` sí se usa mediante su alias `getProfile`. Los exports generados no se proponen para eliminación.

- `frontend/src/api/schema.ts`: `Schemas`, `UpdateStockRequest`, `CategorySummaryResponse`, `CategoryTreeResponse`, `CreateCategoryRequest`, `UpdateCategoryRequest`, `ReorderCategoriesRequest`, `CategoryOrder`, `UpdateRatingRequest`, `RefreshTokenRequest`, `CartSummaryResponse`, `CheckoutItemValidation`, `AddressRequest`, `AddressResponse`, `OrderItemResponse`, `OrderStatusHistoryResponse`, `RecipeImageResponse`, `CreateRecipeRequest`, `UpdateRecipeRequest`, `RecipeStepRequest`, `RecipeIngredientRequest`.
- `frontend/src/store/authStore.ts`: `AuthStatus`.
- `frontend/src/api/types.ts`: `FieldError`.
- `frontend/src/api/recipes.ts`: `RecipeDifficulty`.
- `frontend/src/api/catalog.ts`: `ProductRatingResponse`, `ProductRatingStatsResponse`, `getCategoryMenu`.
- `frontend/src/api/adminCatalog.ts`: `UpdateCatalogCategory`, `ReorderCategories`, `ProductImageInput`.
- `frontend/src/store/uiStore.ts`: `Toast`.
- `frontend/src/api/auth.ts`: `refresh`, `getCurrentUser`.
- `frontend/src/features/auth/hooks.ts`: `useProfile`, `useUpdateProfile`.
- `frontend/src/components/layout/Breadcrumbs.tsx`: `BreadcrumbItem`.
- `frontend/src/components/ui/Tabs.tsx`: `TabItem`.
- `frontend/src/api/payment.ts`: `WompiTransactionStatus`, `WompiReturnParams`.
- `frontend/src/lib/content/contact.ts`: `SocialNetwork`.
- `frontend/src/lib/content/about.ts`: `Milestone`, `TeamMember`.
- `frontend/src/api/contact.ts`: `ContactError`.
- `frontend/src/components/admin/DataTable.tsx`: `TableSort`.
- `frontend/src/features/admin/recipes/form.ts`: `ingredientSchema`, `stepSchema`.
- `frontend/src/lib/mocks.ts`: `CategoryMock`, `ProductMock`, `RecipeMock`, `mockCategories`, `mockProducts`, `mockRecipes`.
- `frontend/src/pages/PlaceholderPage.tsx`: `PlaceholderPage`.
