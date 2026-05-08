-- =====================================================
-- Imágenes adicionales de recetas
-- =====================================================

CREATE TABLE recipe_images (
                               id BIGSERIAL PRIMARY KEY,
                               recipe_id BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,

                               image_url TEXT NOT NULL,
                               alt_text VARCHAR(200),
                               caption VARCHAR(300),

    -- ¿Es la imagen principal?
                               is_primary BOOLEAN NOT NULL DEFAULT FALSE,

    -- Orden de visualización
                               display_order INT NOT NULL DEFAULT 0,

    -- Auditoría
                               created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recipe_images_recipe ON recipe_images(recipe_id);
CREATE INDEX idx_recipe_images_primary ON recipe_images(recipe_id, is_primary) WHERE is_primary = TRUE;

COMMENT ON TABLE recipe_images IS 'Galería de imágenes de cada receta';