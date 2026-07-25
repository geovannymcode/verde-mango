-- =====================================================
-- Módulo: Catalog (Productos)
-- Tablas: categories, products, product_images, product_ratings
-- =====================================================

-- Categorías de productos
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL,
    description TEXT,
    image_url TEXT,
    parent_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    sort_order INT NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    meta_title VARCHAR(70),
    meta_description VARCHAR(160),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_categories_slug UNIQUE (slug),
    CONSTRAINT chk_categories_name_length CHECK (LENGTH(name) >= 2)
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_active ON categories(active);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);

COMMENT ON TABLE categories IS 'Categorías de productos con soporte para jerarquía';

-- Productos
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(300) NOT NULL,
    short_description VARCHAR(500),
    description TEXT,
    price BIGINT NOT NULL,
    compare_at_price BIGINT,
    cost_price BIGINT,
    sku VARCHAR(100),
    barcode VARCHAR(50),
    stock INT NOT NULL DEFAULT 0,
    low_stock_threshold INT NOT NULL DEFAULT 5,
    track_inventory BOOLEAN NOT NULL DEFAULT TRUE,
    allow_backorder BOOLEAN NOT NULL DEFAULT FALSE,
    category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    weight_grams INT,
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    average_rating DECIMAL(3,2),
    rating_count INT NOT NULL DEFAULT 0,
    meta_title VARCHAR(70),
    meta_description VARCHAR(160),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uk_products_slug UNIQUE (slug),
    CONSTRAINT uk_products_sku UNIQUE (sku),
    CONSTRAINT chk_products_price_positive CHECK (price > 0),
    CONSTRAINT chk_products_stock_non_negative CHECK (stock >= 0),
    CONSTRAINT chk_products_rating_range CHECK (average_rating IS NULL OR (average_rating >= 0 AND average_rating <= 5)),
    CONSTRAINT chk_products_compare_price CHECK (compare_at_price IS NULL OR compare_at_price >= price)
);

CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_products_featured ON products(featured);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_stock ON products(stock);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_products_average_rating ON products(average_rating DESC NULLS LAST);
CREATE INDEX idx_products_name_search ON products USING gin(to_tsvector('spanish', name));
CREATE INDEX idx_products_active_category ON products(active, category_id) WHERE active = TRUE;
CREATE INDEX idx_products_featured_active ON products(featured, active) WHERE featured = TRUE AND active = TRUE;

COMMENT ON TABLE products IS 'Catálogo principal de productos';

-- Imágenes de productos
CREATE TABLE product_images (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text VARCHAR(255),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0,
    width INT,
    height INT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_primary ON product_images(product_id, is_primary) WHERE is_primary = TRUE;
CREATE INDEX idx_product_images_sort ON product_images(product_id, sort_order);

CREATE OR REPLACE FUNCTION ensure_single_primary_image()
    RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = TRUE THEN
        UPDATE product_images
        SET is_primary = FALSE
        WHERE product_id = NEW.product_id
          AND id != NEW.id
          AND is_primary = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ensure_single_primary_image
    BEFORE INSERT OR UPDATE ON product_images
    FOR EACH ROW
EXECUTE FUNCTION ensure_single_primary_image();

-- Calificaciones de productos
CREATE TABLE product_ratings (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL,
    rating SMALLINT NOT NULL,
    title VARCHAR(100),
    comment TEXT,
    verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
    approved BOOLEAN NOT NULL DEFAULT TRUE,
    helpful_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_product_ratings_user_product UNIQUE (product_id, user_id),
    CONSTRAINT chk_product_ratings_rating_range CHECK (rating >= 1 AND rating <= 5)
);

CREATE INDEX idx_product_ratings_product_id ON product_ratings(product_id);
CREATE INDEX idx_product_ratings_user_id ON product_ratings(user_id);
CREATE INDEX idx_product_ratings_rating ON product_ratings(rating);
CREATE INDEX idx_product_ratings_approved ON product_ratings(approved) WHERE approved = TRUE;
CREATE INDEX idx_product_ratings_created_at ON product_ratings(created_at DESC);

CREATE OR REPLACE FUNCTION update_product_average_rating()
    RETURNS TRIGGER AS $$
DECLARE
    v_product_id BIGINT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_product_id := OLD.product_id;
    ELSE
        v_product_id := NEW.product_id;
    END IF;

    UPDATE products
    SET
        average_rating = (
            SELECT ROUND(AVG(rating)::numeric, 2)
            FROM product_ratings
            WHERE product_id = v_product_id AND approved = TRUE
        ),
        rating_count = (
            SELECT COUNT(*)
            FROM product_ratings
            WHERE product_id = v_product_id AND approved = TRUE
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_product_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_product_rating
    AFTER INSERT OR UPDATE OR DELETE ON product_ratings
    FOR EACH ROW
EXECUTE FUNCTION update_product_average_rating();
