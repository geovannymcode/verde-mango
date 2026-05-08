-- =====================================================
-- Ingredientes de recetas
-- =====================================================

CREATE TABLE recipe_ingredients (
                                    id BIGSERIAL PRIMARY KEY,
                                    recipe_id BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,

    -- Información del ingrediente
                                    name VARCHAR(200) NOT NULL,
                                    quantity DECIMAL(10,2),
                                    unit VARCHAR(50),

    -- Notas adicionales (ej: "picado finamente", "a temperatura ambiente")
                                    preparation_notes VARCHAR(200),

    -- Grupo (ej: "Para la masa", "Para el relleno")
                                    ingredient_group VARCHAR(100),

    -- Orden de visualización
                                    display_order INT NOT NULL DEFAULT 0,

    -- ¿Es opcional?
                                    optional BOOLEAN NOT NULL DEFAULT FALSE,

    -- Vinculación con producto de la tienda (opcional)
                                    product_id BIGINT,
                                    product_name VARCHAR(255),
                                    product_slug VARCHAR(300),

    -- Auditoría
                                    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_product ON recipe_ingredients(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX idx_recipe_ingredients_order ON recipe_ingredients(recipe_id, display_order);

COMMENT ON TABLE recipe_ingredients IS 'Ingredientes de cada receta';
COMMENT ON COLUMN recipe_ingredients.product_id IS 'ID del producto en Product Service (para "comprar ingredientes")';