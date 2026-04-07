-- =====================================================
-- TABLA: products
-- Descripción: Catálogo principal de productos
-- =====================================================

CREATE TABLE products (
                          id BIGSERIAL PRIMARY KEY,

    -- Información básica
                          name VARCHAR(255) NOT NULL,
                          slug VARCHAR(300) NOT NULL,
                          short_description VARCHAR(500),
                          description TEXT,

    -- Precios (en centavos/pesos colombianos)
                          price BIGINT NOT NULL,
                          compare_at_price BIGINT,
                          cost_price BIGINT,

    -- Inventario
                          sku VARCHAR(100),
                          barcode VARCHAR(50),
                          stock INT NOT NULL DEFAULT 0,
                          low_stock_threshold INT NOT NULL DEFAULT 5,
                          track_inventory BOOLEAN NOT NULL DEFAULT TRUE,
                          allow_backorder BOOLEAN NOT NULL DEFAULT FALSE,

    -- Relaciones
                          category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,

    -- Características
                          weight_grams INT,

    -- Estado y visibilidad
                          featured BOOLEAN NOT NULL DEFAULT FALSE,
                          active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Ratings (desnormalizado para performance)
                          average_rating DECIMAL(3,2),
                          rating_count INT NOT NULL DEFAULT 0,

    -- Metadatos SEO
                          meta_title VARCHAR(70),
                          meta_description VARCHAR(160),

    -- Auditoría
                          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                          published_at TIMESTAMP WITH TIME ZONE,

    -- Constraints
                          CONSTRAINT uk_products_slug UNIQUE (slug),
                          CONSTRAINT uk_products_sku UNIQUE (sku),
                          CONSTRAINT chk_products_price_positive CHECK (price > 0),
                          CONSTRAINT chk_products_stock_non_negative CHECK (stock >= 0),
                          CONSTRAINT chk_products_rating_range CHECK (average_rating IS NULL OR (average_rating >= 0 AND average_rating <= 5)),
                          CONSTRAINT chk_products_compare_price CHECK (compare_at_price IS NULL OR compare_at_price >= price)
);

-- Índices para búsquedas comunes
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_products_featured ON products(featured);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_stock ON products(stock);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_products_average_rating ON products(average_rating DESC NULLS LAST);

-- Índice para búsqueda de texto
CREATE INDEX idx_products_name_search ON products USING gin(to_tsvector('spanish', name));

-- Índice compuesto para filtros comunes
CREATE INDEX idx_products_active_category ON products(active, category_id) WHERE active = TRUE;
CREATE INDEX idx_products_featured_active ON products(featured, active) WHERE featured = TRUE AND active = TRUE;

-- Comentarios
COMMENT ON TABLE products IS 'Catálogo principal de productos';
COMMENT ON COLUMN products.price IS 'Precio en pesos colombianos (sin decimales)';
COMMENT ON COLUMN products.compare_at_price IS 'Precio anterior para mostrar descuento';
COMMENT ON COLUMN products.cost_price IS 'Costo del producto (uso interno)';
COMMENT ON COLUMN products.average_rating IS 'Rating promedio desnormalizado para performance';