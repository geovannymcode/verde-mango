# Gaps vigentes entre frontend y API

Actualizado: 2026-09-25, limpieza autorizada de Fase 9a.
Contrato contrastado al cierre de la auditoría con `/api-docs` en localhost:8082:
**66 paths, 95 schemas**, idénticos en paths/schemas a
`frontend/openapi/verde-mango-openapi.json`. Tipos en `frontend/src/api/openapi.gen.d.ts`.

Esta es la fuente vigente. Las revisiones cronológicas originales se conservaron en
[api-gaps-historial.md](api-gaps-historial.md), explícitamente marcadas como históricas.
Los trabajos no implementados están priorizados en [backlog.md](backlog.md).

## Clasificación vigente

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

## Decisiones de adaptación que permanecen

- **Contacto:** src/api/contact.ts valida y lanza error controlado de indisponibilidad;
  no llama una ruta inventada ni simula éxito. El endpoint futuro debe validar también en servidor.
- **Perfil:** solo lectura. En 9a se retiraron updateProfile/useUpdateProfile y el PATCH /auth/me
  anticipado sin endpoint; no queda una función de envío apuntando a una ruta inexistente.
- **Ratings de catálogo:** tipos manuales fieles a Kotlin hasta separar los schemas de ratings;
  esta excepción NO aplica a categorías de catálogo, ya corregidas en 8b.
- **Imágenes:** ImageUploader recibe URLs y comprueba carga; no promete MIME/peso de un archivo
  remoto ni simula upload. Catálogo guarda principal, no orden completo de las imágenes existentes.
- **Productos:** DELETE administrativo desactiva; no borra físicamente ni rechaza por aparecer
  en órdenes. Categoría con productos propios/descendientes sí rechaza desactivación con 422.
- **Campos null:** varios updates ignoran null; producto exige categoría. No extrapolar esta
  limitación a nutrición de recetas, que sí se puede quitar desde 8d.
- **Nutrición:** DTO de entrada plano calories/proteinGrams/carbsGrams/fatGrams/fiberGrams;
  response nutrition nullable. PUT con replaceNutrition=true reemplaza todos, incluyendo
  ausencias como null. Toggle apagado omite los cinco valores, nunca fabrica ceros.
- **Recetas:** PUT reemplaza arrays completos enviados de pasos/ingredientes/tagIds, sin
  subrecursos. stepNumber desde 1 y displayOrder desde 0; unit libre y quantity decimal opcional.
  Relación con catálogo disponible mediante productId, sin necesidad de una ruta adicional.
- **Pestañas:** eventos storage invalidan queries en el mismo origen; no son push entre dispositivos.
  Recetas no dispone de versión optimista; órdenes sí manejan conflicto de actualización.
- **Historial de orden:** labels locales centralizados en transitions.ts en 9a; DTO de entradas
  no entrega label ni nombre del actor. changedByUserId/changedByType sí existen desde 8c.

## Fase 4 — No existe integración real con Wompi en el backend

Este gap sigue abierto: PaymentApi genera evento simulado; CheckoutService devuelve paymentUrl=null.
El frontend solo redirige si recibe paymentUrl; no construye firmas ni debe recibir llaves privadas.
La tabla payments ahora **sí se lee** mediante AdminOrderReadRepository (8c), pero no existe una
integración que persista y concilie transacciones Wompi reales. No confundir lectura del registro
con integración de pasarela.

El retorno asumido acepta id/reference/status, pero la landing consulta la orden por reference
(orderNumber) y no confía en status de la URL. Aún debe verificarse el contrato del proveedor y
su relación con el estado de pago: la confirmación administrativa de una orden no demuestra un
cobro. Alinear el redirect configurado `/payment/result` con `/checkout/resultado` cuando exista
la integración. Las pruebas MSW de 9b verificarán comportamiento frontend con respuestas mock,
no certificarán un pago real ni un webhook inexistente.

## Contratos disponibles y límites que no son endpoints faltantes

- Auth register/login/refresh/logout/me. Logout revoca todos los refresh tokens del usuario.
- Carrito invitado con X-Session-Id; merge autenticado. Checkout requiere sesión, valida stock y
  crea orden. Orden pública por orderNumber; 404 tanto para inexistente como ajena.
- Catálogo público con filtros/precio/orden/paginación, destacados, relacionados y ratings.
- Administración de catálogo: productos con inactivos/filtros/paginación; categorías con inactivos
  y orden, listado completo no paginado. ADMIN y SUPER_ADMIN admitidos; CUSTOMER rechazado.
- Órdenes admin: multiestado, filtro pago, fecha, sort y paginación; detalle de cliente/pago opcional.
  PATCH estado no modifica ítems/precios, no cobra y no reembolsa. No hay DELETE de órdenes.
- Stats de órdenes: ingresos con rango; conteos/promedio históricos. No sumar una página para
  inventar métricas globales; dashboard usa estadísticas y consultas size=1 para ciertos conteos.
- Recetas admin: listado/detalle/CRUD, publicación/despublicación y feature; DRAFT/PUBLISHED/ARCHIVED.
  No se expone UI de duplicar. Tags existentes por autocomplete. Categorías de receta tienen
  POST/PUT/DELETE/toggle-active admin y lecturas públicas, sin listado admin de inactivas.
- Lecturas públicas de recetas verificadas en vivo en 8d: publicar actualiza listado/recientes y
  nutrición puede desaparecer del detalle. Esto no sustituye una prueba de ratings autenticados.

## Resoluciones posteriores al contrato (9a)

- Rutas administrativas de recetas retiradas de /cuenta; permanecen bajo /admin con AdminRoute.
- Código anticipado de actualización de perfil eliminado; los endpoints faltantes no se inventan.
- Estados/labels/colores de órdenes centralizados; no cambia la máquina de transiciones de 8c.

Contenido editorial pendiente: teléfono/email/redes/equipo/historia y confirmar pin de Maps.
La dirección proporcionada ya está incorporada. Estos pendientes no son gaps del OpenAPI.
