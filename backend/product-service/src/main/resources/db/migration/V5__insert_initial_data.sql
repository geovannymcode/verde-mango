-- =====================================================
-- DATOS INICIALES
-- Basados en las capturas de verdemango.com
-- =====================================================

-- Categorías principales
INSERT INTO categories (name, slug, description, sort_order, active) VALUES
                                                                         ('Fermentos', 'fermentos',
                                                                          'Productos fermentados veganos artesanales. Kimchi, Sauerkraut y más.',
                                                                          1, TRUE),
                                                                         ('Veg-quesos', 'veg-quesos',
                                                                          'Quesos veganos madurados artesanalmente. Libres de lácteos, llenos de sabor.',
                                                                          2, TRUE);

-- Productos: Fermentos
INSERT INTO products (
    name, slug, short_description, description, price, stock,
    category_id, featured, active
) VALUES
      ('Kimchi Vegano', 'kimchi-vegano',
       'Fermentado tradicional coreano con vegetales frescos',
       'Nuestro Kimchi está elaborado siguiendo la receta tradicional coreana, fermentado naturalmente durante semanas para desarrollar su característico sabor umami. Preparado con col china, rábano, cebollín y nuestra mezcla especial de especias. Rico en probióticos naturales.',
       28000, 50, 1, TRUE, TRUE),

      ('Rotkohl', 'rotkohl',
       'Col morada fermentada al estilo alemán',
       'Rotkohl es nuestra versión del clásico alemán. Col morada fermentada naturalmente con manzana verde y especias aromáticas. Perfecto como acompañamiento o en ensaladas. Proceso de fermentación de 4 semanas.',
       28000, 45, 1, TRUE, TRUE),

      ('Sauerkraut', 'sauerkraut',
       'El clásico chucrut alemán, fermentado naturalmente',
       'Sauerkraut tradicional elaborado solo con col verde y sal marina. Fermentación natural sin pasteurizar para conservar todos los probióticos vivos. Crujiente y con ese sabor ácido característico.',
       28000, 60, 1, FALSE, TRUE),

      ('Curtido Salvadoreño', 'curtido-salvadoreno',
       'Fermentado centroamericano con repollo y especias',
       'Curtido tradicional salvadoreño con repollo, zanahoria, cebolla y orégano. El acompañamiento perfecto para pupusas y otros platos centroamericanos. Fermentado naturalmente.',
       25000, 40, 1, FALSE, TRUE);

-- Productos: Veg-quesos
INSERT INTO products (
    name, slug, short_description, description, price, stock,
    category_id, featured, active
) VALUES
      ('Veg-queso Madurado Berenjena', 'veg-queso-madurado-berenjena',
       'Queso vegano madurado con notas ahumadas de berenjena',
       'Veg-queso artesanal elaborado con base de anacardos, fermentado y madurado con berenjena ahumada. Textura cremosa y sabor intenso. Maduración mínima de 3 semanas.',
       30000, 25, 2, TRUE, TRUE),

      ('Veg-queso Madurado Cashewbert', 'veg-queso-madurado-cashewbert',
       'Estilo Camembert vegano con corteza natural',
       'Nuestro Cashewbert es un tributo al Camembert francés. Elaborado 100% con anacardos, desarrolla una corteza blanca natural durante su maduración. Interior cremoso y sabor suave con notas de nuez.',
       31000, 20, 2, TRUE, TRUE),

      ('Veg-queso Madurado Finas Hierbas', 'veg-queso-madurado-finas-hierbas',
       'Queso vegano con mezcla de hierbas aromáticas',
       'Veg-queso madurado con una selección de finas hierbas: romero, tomillo, orégano y albahaca. Base de anacardos fermentados. Perfecto para tablas de quesos veganos.',
       30000, 30, 2, FALSE, TRUE),

      ('Veg-queso Madurado Paprika', 'veg-queso-madurado-paprika',
       'Queso vegano con pimentón ahumado',
       'Veg-queso con pimentón de la vera ahumado, que le da un color rojizo característico y un sabor ligeramente picante. Base de anacardos. Maduración de 4 semanas.',
       30000, 28, 2, FALSE, TRUE),

      ('Veg-queso Madurado Trufado', 'veg-queso-madurado-trufado',
       'Queso vegano premium con trufa negra',
       'Nuestra joya: Veg-queso madurado con trufa negra real. Aroma intenso y sabor terroso característico de la trufa. Edición limitada. Para los paladares más exigentes.',
       45000, 15, 2, TRUE, TRUE);

-- Imágenes de productos (URLs de ejemplo)
INSERT INTO product_images (product_id, url, alt_text, is_primary, sort_order)
SELECT
    p.id,
    'https://cdn.verdemango.com/products/' || p.slug || '.jpg',
    p.name,
    TRUE,
    0
FROM products p;