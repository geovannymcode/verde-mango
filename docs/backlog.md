# Backlog — estado tras la auditoría 9a

Actualizado: 2026-09-25, tras la limpieza selectiva autorizada. **Pendientes restantes, sin autorización para implementarlos.**
Fase 9 no añade funcionalidad. Las correcciones y limpiezas deben seleccionarse a partir de
[la auditoría 9a](auditoria-9a.md); las ampliaciones funcionales requieren una fase posterior.
P0 = bloquea pagos reales; P1 = importante antes de publicar; P2 = mejora/limitación; P3 = opcional.

## P0 — integración pendiente para vender con pago real

- **Wompi real en backend:** crear checkout firmado/paymentUrl, persistir transacción, validar
  webhook, conciliar estados y definir retorno `/checkout/resultado` con identificación de orden.
  PaymentApi hoy simula confirmación y CheckoutService devuelve paymentUrl=null. No activar pagos
  reales ni presentar tests MSW como integración de pasarela. No exponer secretos al frontend.
- **Fuente fiable del resultado de pago:** definir qué debe consultar la landing; actualmente
  estados de orden (también modificables por admin) se interpretan como aprobación/rechazo.
  Definir comprobantes y reembolsos monetarios por separado: PATCH de estado no los ejecuta.

## P1 — correcciones/documentación para decidir antes de publicación

- Separar errores de red/servidor de vacío y 404 en el listado/detalle de pedidos del cliente.
- Evitar limpiar ReviewForm antes de confirmar éxito del servidor; conservar texto al fallar.
- Verificar secuencia login → fusión de carrito → returnTo en 9b: actualmente la fusión se dispara
  sin esperarla. Registrar fallos/concurrencia con mocks antes de decidir corrección.
- Completar datos reales de teléfono, email, redes, equipo e historia; confirmar pin/embed de Maps.
  La dirección ya está confirmada. Eliminar destinos `#` de Footer mediante decisión editorial.
- Excluir o restringir `/dev/status` antes de producción; es ruta activa, no archivo huérfano.

## P2 — funcionalidades o contratos ausentes (no implementar en Fase 9)

- Endpoint real de contacto con DTO, validación y protección de servidor. Frontend hoy informa
  indisponibilidad honestamente mediante src/api/contact.ts.
- Endpoint de edición de perfil; UI actual de solo lectura.
- Búsqueda global del Header: botón sin acción. Definir destino/comportamiento o retirarlo tras aprobación.
- Intersección real de filtros públicos de recetas en base de datos; hoy search/category/tag
  tienen prioridad excluyente. Los filtros admin ya están resueltos.
- Corregir colisión OpenAPI de ratings de productos/recetas y regenerar tipos; categorías ya resueltas.
- Upload/almacenamiento de imágenes y persistencia del orden completo de imágenes de producto.
  Actualmente URL con preview y selección de principal; no hay subida real.
- Listado administrativo de categorías de recetas con inactivas. Hoy selector público con fallback
  a la categoría ya asignada. CRUD de tags y duplicación de receta no existen.
- Definir referencia de nutrición por porción o por receta; no completar datos suponiéndola.
- Nombre del autor de reseñas de producto; actualmente solo userId.
- Endpoint de rango dinámico de precios; hoy límites fijos del slider y entrada manual.
- Documentar/decidir control de concurrencia de recetas; actualmente no tiene versión optimista.

## P3 — ampliaciones opcionales, requieren alcance explícito

- Favoritos/wishlist: no hay endpoint ni corazón funcional en Header.
- Recetas relacionadas por tags cuando no haya categoría; hoy solo categoría.
- Perfil administrativo de cliente, URL de comprobante, operaciones de reembolso de pasarela.
- Semántica uniforme de rangos en stats: hoy conteos/promedio históricos e ingresos con rango.
- Logout por dispositivo frente a logout global de refresh tokens.
- Push entre dispositivos; la invalidación actual se comunica por storage en el mismo origen.

## Refactors expresamente aplazados

- **Overlays Drawer/Modal:** no unificar ahora. Mantener implementación hasta las verificaciones
  de foco/teclado de 9c; no se modificaron sus fuentes.
- **Sincronización entre pestañas:** no unificar catalogSync/orders/sync/recipes/sync antes de 9b;
  no se modificaron sus implementaciones.
- **Handlers cortos:** conservar duplicación deliberada. No extraer handlers de carrito ni
  errores de formularios por similitud superficial.
- Historial de órdenes compartido y redes sociales reutilizables: no autorizados en esta limpieza.
- Advertencia RHF/watch, supresión exhaustive-deps del slider y console.error de fusión: revisar
  dentro de las subentregas previstas; no se cambió comportamiento.
- `@testing-library/user-event` se conserva explícitamente para los siete flujos de 9b.

## Resuelto en limpieza autorizada de 9a

- Rutas de recetas retiradas de /cuenta; solo /admin bajo AdminRoute. Seis pruebas de regresión
  sobre configuración real cubren alias inexistentes y roles CUSTOMER/ADMIN/SUPER_ADMIN.
- Eliminados lib/mocks.ts, PlaceholderPage.tsx y el barrel components/ui/index.ts.
- Eliminados useProfile, useUpdateProfile, updateProfile/PATCH ficticio, refresh API sin consumidor
  y getCategoryMenu. auth/keys.ts también eliminado al quedar sin consumidores. Se conserva
  getCurrentUser, que sí se consume mediante getProfile, y el refresh real de api/client.ts.
- Estados/etiquetas/colores de órdenes centralizados en transitions.ts; panel y cuenta usan la
  misma presentación. Máquina de transiciones de 8c sin cambios.
- Único helper de slug en lib/slug.ts, usado por productos, categorías y recetas; se conservó
  el comportamiento de autogeneración/edición manual, sin abstraer handlers.
- api-gaps.md consolidado en faltantes/degradados/resueltos por fase; historial preservado aparte.
- Formato separado: 31 archivos cambiados exclusivamente por Prettier. De los 33 iniciales,
  mocks.ts fue eliminado y auth.ts ya quedó formateado tras retirar funciones sin uso.

## Subentregas 9b–9e aún no iniciadas

- 9b: siete flujos con Vitest/Testing Library/MSW, sin backend real; cobertura por carpeta.
- 9c: auditoría axe/teclado/foco/contraste y hallazgos por severidad antes de corregir.
- 9d: splitting por rutas/admin, análisis de bundle, imágenes/fuentes, build y revisión de secretos.
- 9e: README frontend/raíz, instrucciones de despliegue, SPA fallback, entorno/CORS y backlog final.

No se añadieron dependencias ni funcionalidad. Se aplicaron únicamente correcciones/refactors autorizados y las seis pruebas de seguridad. 9b todavía no comenzó.
