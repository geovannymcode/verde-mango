-- =====================================================
-- TABLA: categories
-- Descripción: Categorías de productos con soporte para
--              jerarquía padre-hijo
-- =====================================================

CREATE TABLE categories (
                            id BIGSERIAL PRIMARY KEY,

    -- Información básica
                            name VARCHAR(100) NOT NULL,
                            slug VARCHAR(120) NOT NULL,
                            description TEXT,
                            image_url TEXT,

    -- Jerarquía
                            parent_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,

    -- Orden y estado
                            sort_order INT NOT NULL DEFAULT 0,
                            active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Metadatos SEO
                            meta_title VARCHAR(70),
                            meta_description VARCHAR(160),

    -- Auditoría
                            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
                            CONSTRAINT uk_categories_slug UNIQUE (slug),
                            CONSTRAINT chk_categories_name_length CHECK (LENGTH(name) >= 2)
);

-- Índices
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_active ON categories(active);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);

-- Comentarios
COMMENT ON TABLE categories IS 'Categorías de productos con soporte para jerarquía';
COMMENT ON COLUMN categories.parent_id IS 'Referencia a categoría padre para jerarquía';
COMMENT ON COLUMN categories.sort_order IS 'Orden de visualización (menor = primero)';