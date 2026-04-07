-- =====================================================
-- TABLA: product_images
-- Descripción: Imágenes de productos
-- =====================================================

CREATE TABLE product_images (
                                id BIGSERIAL PRIMARY KEY,

    -- Relación
                                product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,

    -- Imagen
                                url TEXT NOT NULL,
                                alt_text VARCHAR(255),

    -- Ordenamiento
                                is_primary BOOLEAN NOT NULL DEFAULT FALSE,
                                sort_order INT NOT NULL DEFAULT 0,

    -- Dimensiones (opcionales, para lazy loading)
                                width INT,
                                height INT,

    -- Auditoría
                                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_primary ON product_images(product_id, is_primary) WHERE is_primary = TRUE;
CREATE INDEX idx_product_images_sort ON product_images(product_id, sort_order);

-- Función para asegurar solo una imagen primaria por producto
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

COMMENT ON TABLE product_images IS 'Imágenes asociadas a productos';
COMMENT ON COLUMN product_images.is_primary IS 'Solo una imagen puede ser primaria por producto';