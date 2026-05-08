-- =====================================================
-- Categorías de recetas (jerárquicas)
-- =====================================================

CREATE TABLE recipe_categories (
                                   id BIGSERIAL PRIMARY KEY,

                                   name VARCHAR(100) NOT NULL,
                                   slug VARCHAR(120) NOT NULL UNIQUE,
                                   description TEXT,
                                   image_url TEXT,

    -- Jerarquía
                                   parent_id BIGINT REFERENCES recipe_categories(id) ON DELETE SET NULL,

    -- Orden de visualización
                                   display_order INT NOT NULL DEFAULT 0,

    -- Estado
                                   active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Contadores (desnormalizados para performance)
                                   recipe_count INT NOT NULL DEFAULT 0,

    -- Auditoría
                                   created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                   updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recipe_categories_slug ON recipe_categories(slug);
CREATE INDEX idx_recipe_categories_parent ON recipe_categories(parent_id);
CREATE INDEX idx_recipe_categories_active ON recipe_categories(active);
CREATE INDEX idx_recipe_categories_order ON recipe_categories(display_order);

COMMENT ON TABLE recipe_categories IS 'Categorías de recetas veganas';