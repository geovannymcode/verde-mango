-- =====================================================
-- Pasos de preparación de recetas
-- =====================================================

CREATE TABLE recipe_steps (
                              id BIGSERIAL PRIMARY KEY,
                              recipe_id BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,

    -- Número de paso (1, 2, 3...)
                              step_number INT NOT NULL,

    -- Instrucción
                              instruction TEXT NOT NULL,

    -- Imagen opcional del paso
                              image_url TEXT,

    -- Tip o nota adicional
                              tip TEXT,

    -- Tiempo estimado de este paso (minutos, opcional)
                              estimated_time INT,

    -- Auditoría
                              created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Un paso por número por receta
                              CONSTRAINT uq_recipe_steps_number UNIQUE (recipe_id, step_number)
);

CREATE INDEX idx_recipe_steps_recipe ON recipe_steps(recipe_id);

COMMENT ON TABLE recipe_steps IS 'Pasos de preparación de cada receta';