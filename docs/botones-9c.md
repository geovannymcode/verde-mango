# Botones sólidos — cierre de 9c

Inventario estático de todos los usos Button sólidos (incluido el valor por defecto), enlaces con buttonClasses sólidos y botones/enlaces con fondo naranja explícito. Tamaños en px con raíz de 16px. No es una medición de layout en navegador.

## Regla aplicada

- Button naranja md: 15/600 → 19/700; lg: 16/600 → 19/700, fondo original.
- Button naranja sm: 14/600 → 19/700, fondo original. No hay consumidores sólidos sm actualmente; se conserva coherencia para nuevos usos. Los sólidos usan altura mínima y permiten envolver texto para evitar recortes.
- Button verde: tamaños sólidos → mínimo 16/700, mismo fondo (ink sobre verde ya tiene contraste suficiente).
- Crear producto: 14/600 → 19/700; nueva receta: 16/400 → 19/700.
- Paginación: 14/600 → 19/700, fondo original.
- Botones solo con icono (vista lista/grid y redes): no tienen tamaño de texto; se conserva el fondo.
- Hover naranja ya no reduce la opacidad: conserva ratio 3.083:1 y usa sombra.

| Ubicación | Antes | Después |
|---|---|---|
| src/components/admin/ConfirmDialog.tsx:66 | 15px / 600 | 19px / 700; naranja original |
| src/components/admin/DeleteProductDialog.tsx:35 | 15px / 600 | 19px / 700; naranja original |
| src/components/admin/FormShell.tsx:68 | 15px / 600 | 19px / 700; naranja original |
| src/components/catalog/CatalogToolbar.tsx:51 | Solo iconos (sin texto) | Sin cambio |
| src/components/catalog/CatalogToolbar.tsx:62 | Solo iconos (sin texto) | Sin cambio |
| src/components/catalog/ReviewForm.tsx:70 | 15px / 600 | 19px / 700; naranja original |
| src/components/layout/CartDrawer.tsx:102 | 15px / 600 | 19px / 700; naranja original |
| src/components/recipes/RecipeRatings.tsx:125 | 15px / 600 | 19px / 700; naranja original |
| src/components/ui/Pagination.tsx:27 | 14px / 600 | 19px / 700; naranja original |
| src/features/admin/orders/OrderStatusControl.tsx:73 | 15px / 600 | 19px / 700; naranja original |
| src/features/admin/recipes/IngredientPaste.tsx:53 | 15px / 600 | 19px / 700; naranja original |
| src/pages/CartPage.tsx:106 | 15px / 600 | 19px / 700; naranja original |
| src/pages/CheckoutPage.tsx:227 | 15px / 600 | 19px / 700; naranja original |
| src/pages/CheckoutResultPage.tsx:84 | 15px / 600 | 19px / 700; naranja original |
| src/pages/CheckoutResultPage.tsx:135 | 15px / 600 | 19px / 700; naranja original |
| src/pages/ContactPage.tsx:231 | 15px / 600 | 19px / 700; naranja original |
| src/pages/ForbiddenPage.tsx:17 | 15–16px / 600 según tamaño (Home lg: 16px) | 19px / 700; naranja original |
| src/pages/HomePage.tsx:40 | 15–16px / 600 según tamaño (Home lg: 16px) | 19px / 700; naranja original |
| src/pages/LoginPage.tsx:91 | 15px / 600 | 19px / 700; naranja original |
| src/pages/NotFoundPage.tsx:14 | 15–16px / 600 según tamaño (Home lg: 16px) | 19px / 700; naranja original |
| src/pages/ProductDetailPage.tsx:163 | 15px / 600 | 19px / 700; naranja original |
| src/pages/RegisterPage.tsx:132 | 15px / 600 | 19px / 700; naranja original |
| src/pages/account/OrderDetailPage.tsx:202 | 15px / 600 | 19px / 700; naranja original |
| src/pages/account/ProfilePage.tsx:53 | 15px / 600 | 19px / 700; naranja original |
| src/pages/admin/AdminOrderDetailPage.tsx:38 | 15px / 600 | 19px / 700; naranja original |
| src/pages/admin/CategoriesPage.tsx:313 | 15px / 600 | 19px / 700; naranja original |
| src/pages/admin/CategoriesPage.tsx:332 | 15px / 600 | 19px / 700; naranja original |
| src/pages/admin/ProductFormPage.tsx:232 | 15px / 600 | 19px / 700; naranja original |
| src/pages/admin/ProductsPage.tsx:104 | 14px / 600 | 19px / 700; naranja original |
| src/pages/admin/RecipeFormPage.tsx:154 | 15px / 600 | 19px / 700; naranja original |
| src/pages/admin/RecipeFormPage.tsx:178 | 15px / 600 | 19px / 700; naranja original |
| src/pages/admin/RecipeFormPage.tsx:484 | 15px / 600 | 19px / 700; naranja original |
| src/pages/admin/RecipesPage.tsx:89 | 16px / 400 | 19px / 700; naranja original |

El blanco sobre el fondo original no cumple para 16px bold: se aplica 19px/700 en todos los tamaños. Los contadores y números de pasos no son botones; no se alteran por esta decisión y siguen pendientes de contraste.

No se aplicó el fallback de fondo oscuro: no se confirmó ningún botón que lo necesitara. No se afirma que exista validación visual exhaustiva en todos los anchos; el inventario es de código y las regresiones son de DOM/axe.
