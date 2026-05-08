-- =====================================================
-- Datos iniciales: Categorías y Tags
-- =====================================================

-- Categorías principales
INSERT INTO recipe_categories (name, slug, description, display_order) VALUES
                                                                           ('Desayunos', 'desayunos', 'Recetas veganas para comenzar el día con energía', 1),
                                                                           ('Almuerzos', 'almuerzos', 'Platos principales para el almuerzo', 2),
                                                                           ('Cenas', 'cenas', 'Recetas ligeras y nutritivas para la noche', 3),
                                                                           ('Postres', 'postres', 'Dulces veganos deliciosos', 4),
                                                                           ('Snacks', 'snacks', 'Bocadillos saludables entre comidas', 5),
                                                                           ('Bebidas', 'bebidas', 'Jugos, smoothies y bebidas saludables', 6),
                                                                           ('Fermentados', 'fermentados', 'Recetas con nuestros productos fermentados', 7);

-- Subcategorías de Fermentados
INSERT INTO recipe_categories (name, slug, description, parent_id, display_order) VALUES
                                                                                      ('Con Kimchi', 'con-kimchi', 'Recetas usando kimchi vegano',
                                                                                       (SELECT id FROM recipe_categories WHERE slug = 'fermentados'), 1),
                                                                                      ('Con Chucrut', 'con-chucrut', 'Recetas usando chucrut',
                                                                                       (SELECT id FROM recipe_categories WHERE slug = 'fermentados'), 2),
                                                                                      ('Con Veg-quesos', 'con-veg-quesos', 'Recetas usando nuestros quesos veganos',
                                                                                       (SELECT id FROM recipe_categories WHERE slug = 'fermentados'), 3);

-- Tags populares
INSERT INTO recipe_tags (name, slug) VALUES
                                         ('Sin Gluten', 'sin-gluten'),
                                         ('Alto en Proteína', 'alto-en-proteina'),
                                         ('Bajo en Calorías', 'bajo-en-calorias'),
                                         ('Rápido', 'rapido'),
                                         ('Para Niños', 'para-ninos'),
                                         ('Meal Prep', 'meal-prep'),
                                         ('Sin Soya', 'sin-soya'),
                                         ('Sin Frutos Secos', 'sin-frutos-secos'),
                                         ('Raw', 'raw'),
                                         ('Comfort Food', 'comfort-food'),
                                         ('Económico', 'economico'),
                                         ('Gourmet', 'gourmet'),
                                         ('Colombiano', 'colombiano'),
                                         ('Asiático', 'asiatico'),
                                         ('Mediterráneo', 'mediterraneo');

-- Receta de ejemplo: Bibimbap con Kimchi
INSERT INTO recipes (
    title, slug, description, introduction,
    prep_time, cook_time, servings, difficulty,
    status, featured, category_id, author_name,
    meta_title, meta_description, published_at
) VALUES (
             'Bibimbap Vegano con Kimchi',
             'bibimbap-vegano-con-kimchi',
             'Un clásico coreano reinventado con ingredientes 100% vegetales. Arroz, vegetales salteados, tofu y nuestro delicioso kimchi vegano.',
             'El bibimbap (비빔밥) es uno de los platos más icónicos de Corea. Esta versión vegana mantiene toda la esencia del original, usando tofu marinado en lugar de carne y nuestro kimchi artesanal que le da ese toque fermentado perfecto.',
             30, 20, 2, 'MEDIUM',
             'PUBLISHED', TRUE,
             (SELECT id FROM recipe_categories WHERE slug = 'con-kimchi'),
             'Chef Verde Mango',
             'Bibimbap Vegano con Kimchi | Verde Mango',
             'Receta fácil de bibimbap vegano con kimchi artesanal. Un plato coreano delicioso y 100% plant-based.',
             CURRENT_TIMESTAMP
         );

-- Ingredientes del bibimbap
INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit, ingredient_group, display_order, product_id, product_name, product_slug) VALUES
                                                                                                                                              ((SELECT id FROM recipes WHERE slug = 'bibimbap-vegano-con-kimchi'), 'Arroz de grano corto cocido', 2, 'tazas', 'Base', 1, NULL, NULL, NULL),
                                                                                                                                              ((SELECT id FROM recipes WHERE slug = 'bibimbap-vegano-con-kimchi'), 'Kimchi Vegano Verde Mango', 150, 'g', 'Base', 2, 1, 'Kimchi Vegano Artesanal', 'kimchi-vegano-artesanal'),
                                                                                                                                              ((SELECT id FROM recipes WHERE slug = 'bibimbap-vegano-con-kimchi'), 'Tofu firme', 200, 'g', 'Proteína', 3, NULL, NULL, NULL),
                                                                                                                                              ((SELECT id FROM recipes WHERE slug = 'bibimbap-vegano-con-kimchi'), 'Espinacas frescas', 100, 'g', 'Vegetales', 4, NULL, NULL, NULL),
                                                                                                                                              ((SELECT id FROM recipes WHERE slug = 'bibimbap-vegano-con-kimchi'), 'Zanahorias', 1, 'unidad', 'Vegetales', 5, NULL, NULL, NULL),
                                                                                                                                              ((SELECT id FROM recipes WHERE slug = 'bibimbap-vegano-con-kimchi'), 'Zucchini', 1, 'unidad', 'Vegetales', 6, NULL, NULL, NULL),
                                                                                                                                              ((SELECT id FROM recipes WHERE slug = 'bibimbap-vegano-con-kimchi'), 'Hongos shiitake', 100, 'g', 'Vegetales', 7, NULL, NULL, NULL),
                                                                                                                                              ((SELECT id FROM recipes WHERE slug = 'bibimbap-vegano-con-kimchi'), 'Brotes de soya', 100, 'g', 'Vegetales', 8, NULL, NULL, NULL),
                                                                                                                                              ((SELECT id FROM recipes WHERE slug = 'bibimbap-vegano-con-kimchi'), 'Gochujang (pasta de chile coreana)', 2, 'cucharadas', 'Salsa', 9, NULL, NULL, NULL),
                                                                                                                                              ((SELECT id FROM recipes WHERE slug = 'bibimbap-vegano-con-kimchi'), 'Aceite de sésamo', 2, 'cucharadas', 'Salsa', 10, NULL, NULL, NULL),
                                                                                                                                              ((SELECT id FROM recipes WHERE slug = 'bibimbap-vegano-con-kimchi'), 'Salsa de soya', 2, 'cucharadas', 'Salsa', 11, NULL, NULL, NULL),
                                                                                                                                              ((SELECT id FROM recipes WHERE slug = 'bibimbap-vegano-con-kimchi'), 'Semillas de sésamo', 1, 'cucharada', 'Topping', 12, NULL, NULL, NULL);

-- Pasos del bibimbap
INSERT INTO recipe_steps (recipe_id, step_number, instruction, tip) VALUES
                                                                        ((SELECT id FROM recipes WHERE slug = 'bibimbap-vegano-con-kimchi'), 1,
                                                                         'Prepara todos los vegetales: corta la zanahoria y el zucchini en juliana, rebana los hongos y lava las espinacas y los brotes de soya.',
                                                                         'Tener todo listo antes de cocinar hace el proceso mucho más fluido.'),
                                                                        ((SELECT id FROM recipes WHERE slug = 'bibimbap-vegano-con-kimchi'), 2,
                                                                         'Corta el tofu en cubos y marínalo con 1 cucharada de salsa de soya y unas gotas de aceite de sésamo por 10 minutos.',
                                                                         'Presiona el tofu con papel absorbente antes para que absorba mejor el marinado.'),
                                                                        ((SELECT id FROM recipes WHERE slug = 'bibimbap-vegano-con-kimchi'), 3,
                                                                         'Saltea cada vegetal por separado en una sartén con un poco de aceite: primero la zanahoria (3 min), luego el zucchini (2 min), los hongos (3 min) y finalmente las espinacas (1 min). Sazona ligeramente con sal.',
                                                                         NULL),
                                                                        ((SELECT id FROM recipes WHERE slug = 'bibimbap-vegano-con-kimchi'), 4,
                                                                         'Dora el tofu marinado en la sartén hasta que esté dorado por todos lados (aproximadamente 5 minutos).',
                                                                         NULL),
                                                                        ((SELECT id FROM recipes WHERE slug = 'bibimbap-vegano-con-kimchi'), 5,
                                                                         'Prepara la salsa mezclando el gochujang, 1 cucharada de aceite de sésamo, 1 cucharada de salsa de soya y 1 cucharada de agua.',
                                                                         'Ajusta la cantidad de gochujang según tu tolerancia al picante.'),
                                                                        ((SELECT id FROM recipes WHERE slug = 'bibimbap-vegano-con-kimchi'), 6,
                                                                         'Sirve el arroz caliente en un bowl, organiza los vegetales, el tofu y el kimchi en secciones sobre el arroz. Añade la salsa de gochujang en el centro y espolvorea con semillas de sésamo.',
                                                                         'Para una experiencia más auténtica, usa un bowl de piedra caliente (dolsot) si lo tienes.'),
                                                                        ((SELECT id FROM recipes WHERE slug = 'bibimbap-vegano-con-kimchi'), 7,
                                                                         'Mezcla todo justo antes de comer para combinar todos los sabores. ¡Disfruta!',
                                                                         'El bibimbap significa literalmente "arroz mezclado" - ¡no tengas miedo de revolver todo!');

-- Asignar tags al bibimbap
INSERT INTO recipe_tag_assignments (recipe_id, tag_id) VALUES
                                                           ((SELECT id FROM recipes WHERE slug = 'bibimbap-vegano-con-kimchi'), (SELECT id FROM recipe_tags WHERE slug = 'alto-en-proteina')),
                                                           ((SELECT id FROM recipes WHERE slug = 'bibimbap-vegano-con-kimchi'), (SELECT id FROM recipe_tags WHERE slug = 'asiatico')),
                                                           ((SELECT id FROM recipes WHERE slug = 'bibimbap-vegano-con-kimchi'), (SELECT id FROM recipe_tags WHERE slug = 'comfort-food'));

-- Actualizar contador de recetas en categoría
UPDATE recipe_categories SET recipe_count = 1 WHERE slug = 'con-kimchi';