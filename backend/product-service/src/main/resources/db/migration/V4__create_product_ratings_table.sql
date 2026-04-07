-- =====================================================
-- TABLA: product_ratings
-- Descripción: Calificaciones y reseñas de productos
-- =====================================================

CREATE TABLE product_ratings (
                                 id BIGSERIAL PRIMARY KEY,

    -- Relaciones
                                 product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                                 user_id BIGINT NOT NULL,

    -- Rating
                                 rating SMALLINT NOT NULL,
                                 title VARCHAR(100),
                                 comment TEXT,

    -- Verificación
                                 verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,

    -- Moderación
                                 approved BOOLEAN NOT NULL DEFAULT TRUE,

    -- Utilidad
                                 helpful_count INT NOT NULL DEFAULT 0,

    -- Auditoría
                                 created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                 updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
                                 CONSTRAINT uk_product_ratings_user_product UNIQUE (product_id, user_id),
                                 CONSTRAINT chk_product_ratings_rating_range CHECK (rating >= 1 AND rating <= 5)
);

-- Índices
CREATE INDEX idx_product_ratings_product_id ON product_ratings(product_id);
CREATE INDEX idx_product_ratings_user_id ON product_ratings(user_id);
CREATE INDEX idx_product_ratings_rating ON product_ratings(rating);
CREATE INDEX idx_product_ratings_approved ON product_ratings(approved) WHERE approved = TRUE;
CREATE INDEX idx_product_ratings_created_at ON product_ratings(created_at DESC);

-- Función para actualizar rating promedio del producto
CREATE OR REPLACE FUNCTION update_product_average_rating()
    RETURNS TRIGGER AS $$
DECLARE
    v_product_id BIGINT;
BEGIN
    -- Determinar el product_id afectado
    IF TG_OP = 'DELETE' THEN
        v_product_id := OLD.product_id;
    ELSE
        v_product_id := NEW.product_id;
    END IF;

    -- Actualizar el rating promedio
    UPDATE products
    SET
        average_rating = (
            SELECT ROUND(AVG(rating)::numeric, 2)
            FROM product_ratings
            WHERE product_id = v_product_id
              AND approved = TRUE
        ),
        rating_count = (
            SELECT COUNT(*)
            FROM product_ratings
            WHERE product_id = v_product_id
              AND approved = TRUE
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

COMMENT ON TABLE product_ratings IS 'Calificaciones y reseñas de productos por usuarios';
COMMENT ON COLUMN product_ratings.verified_purchase IS 'TRUE si el usuario compró el producto';
COMMENT ON COLUMN product_ratings.helpful_count IS 'Contador de votos de utilidad';