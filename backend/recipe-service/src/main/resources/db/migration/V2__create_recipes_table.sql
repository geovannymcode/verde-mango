-- =====================================================
-- Tabla principal de recetas
-- =====================================================

CREATE TABLE recipes (
                         id BIGSERIAL PRIMARY KEY,

    -- Información básica
                         title VARCHAR(200) NOT NULL,
                         slug VARCHAR(250) NOT NULL UNIQUE,
                         description TEXT NOT NULL,

    -- Contenido largo
                         introduction TEXT,
                         tips TEXT,

    -- Tiempos (en minutos)
                         prep_time INT NOT NULL DEFAULT 0,
                         cook_time INT NOT NULL DEFAULT 0,
                         total_time INT GENERATED ALWAYS AS (prep_time + cook_time) STORED,

    -- Porciones
                         servings INT NOT NULL DEFAULT 4,
                         servings_unit VARCHAR(50) DEFAULT 'porciones',

    -- Clasificación
                         difficulty VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
                         category_id BIGINT REFERENCES recipe_categories(id) ON DELETE SET NULL,

    -- Estado y visibilidad
                         status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
                         featured BOOLEAN NOT NULL DEFAULT FALSE,

    -- Imagen principal
                         primary_image_url TEXT,

    -- SEO
                         meta_title VARCHAR(70),
                         meta_description VARCHAR(160),

    -- Información nutricional (por porción, opcional)
                         calories INT,
                         protein_grams DECIMAL(5,1),
                         carbs_grams DECIMAL(5,1),
                         fat_grams DECIMAL(5,1),
                         fiber_grams DECIMAL(5,1),

    -- Estadísticas
                         views BIGINT NOT NULL DEFAULT 0,
                         rating_count INT NOT NULL DEFAULT 0,
                         rating_average DECIMAL(2,1) NOT NULL DEFAULT 0,

    -- Autor
                         author_id BIGINT,
                         author_name VARCHAR(100),

    -- Fechas
                         published_at TIMESTAMP WITH TIME ZONE,
                         created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                         updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_recipes_slug ON recipes(slug);
CREATE INDEX idx_recipes_status ON recipes(status);
CREATE INDEX idx_recipes_category ON recipes(category_id);
CREATE INDEX idx_recipes_featured ON recipes(featured) WHERE featured = TRUE;
CREATE INDEX idx_recipes_difficulty ON recipes(difficulty);
CREATE INDEX idx_recipes_published ON recipes(published_at DESC) WHERE status = 'PUBLISHED';
CREATE INDEX idx_recipes_views ON recipes(views DESC);
CREATE INDEX idx_recipes_rating ON recipes(rating_average DESC);

-- Índice para búsqueda de texto
CREATE INDEX idx_recipes_search ON recipes USING gin(
                                                     to_tsvector('spanish', title || ' ' || COALESCE(description, ''))
    );

COMMENT ON TABLE recipes IS 'Recetas veganas del blog';
COMMENT ON COLUMN recipes.total_time IS 'Tiempo total calculado (prep + cook)';
COMMENT ON COLUMN recipes.status IS 'DRAFT, PUBLISHED, ARCHIVED';
COMMENT ON COLUMN recipes.difficulty IS 'EASY, MEDIUM, HARD';