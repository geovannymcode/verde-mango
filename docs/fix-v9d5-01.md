# V9D5-01 resuelto — grupos de acciones

El botón sólido permitía crecer al envolver texto (75px), pero outline conservaba h-11 (44px). En resultado de pago, flex estiraba los enlaces envolventes, no sus botones. ConfirmDialog compartía la mezcla de alturas. Drawer y carrito apilaban sus acciones y no tenían el desajuste lateral, aunque sí alturas distintas.

Se añadió vm-action-group en index.css: grid con columnas iguales, filas de igual altura, stretch y altura automática de botones con mínimo común de 48px. Admite enlaces envolventes y variante stacked. Se aplica en CheckoutResultPage, ConfirmDialog, CartDrawer y CartPage. No se acortaron textos ni se redujo el tamaño tipográfico. El resultado permite 512px de ancho de grupo para conservar una línea en tablet/escritorio.

Verificación real en navegador integrado, páginas reales con fixtures de la herramienta local de auditoría, viewport de 900px de alto. Sin mutaciones del backend:

| Grupo (altura de cada botón) | 375px | 768px | 1440px |
| --- | --- | --- | --- |
| Resultado de pago | 75 / 75 | 48 / 48 | 48 / 48 |
| Carrito | 48 / 48 | 48 / 48 | 48 / 48 |
| CartDrawer | 48 / 48 | 48 / 48 | 48 / 48 |
| ConfirmDialog (Cancelar / Aplicar cambio) | 75 / 75 | 48 / 48 | 48 / 48 |

Sin texto recortado, solapamientos ni desbordamiento horizontal. ConfirmDialog centraliza el arreglo para las confirmaciones de órdenes y borrado de productos, categorías y recetas. Se verificó visualmente el estado de orden sin enviar el cambio.

Validación: 189 tests / 35 archivos pasan, build TypeScript + Vite correcto, git diff --check correcto. Las medidas de layout son del navegador, no de jsdom.
