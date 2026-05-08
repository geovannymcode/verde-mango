-- =====================================================
-- Calificaciones y reseñas de recetas
-- =====================================================

CREATE TABLE recipe_ratings (
                                id BIGSERIAL PRIMARY KEY,
                                recipe_id BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,

    -- Usuario que calificó
                                user_id BIGINT NOT NULL,
                                user_name VARCHAR(100),

    -- Calificación (1-5 estrellas)
                                rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),

    -- Comentario opcional
                                comment TEXT,

    -- ¿El usuario preparó la receta?
                                made_recipe BOOLEAN DEFAULT FALSE,

    -- Moderación
                                approved BOOLEAN NOT NULL DEFAULT TRUE,

    -- Auditoría
                                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Un usuario solo puede calificar una vez por receta
                                CONSTRAINT uq_recipe_ratings_user UNIQUE (recipe_id, user_id)
);

CREATE INDEX idx_recipe_ratings_recipe ON recipe_ratings(recipe_id);
CREATE INDEX idx_recipe_ratings_user ON recipe_ratings(user_id);
CREATE INDEX idx_recipe_ratings_approved ON recipe_ratings(recipe_id, approved) WHERE approved = TRUE;

-- Trigger para actualizar promedios en recipes
CREATE OR REPLACE FUNCTION update_recipe_rating_stats()
    RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE recipes SET
                           rating_count = (SELECT COUNT(*) FROM recipe_ratings WHERE recipe_id = NEW.recipe_id AND approved = TRUE),
                           rating_average = (SELECT COALESCE(AVG(rating), 0) FROM recipe_ratings WHERE recipe_id = NEW.recipe_id AND approved = TRUE),
                           updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.recipe_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE recipes SET
                           rating_count = (SELECT COUNT(*) FROM recipe_ratings WHERE recipe_id = OLD.recipe_id AND approved = TRUE),
                           rating_average = (SELECT COALESCE(AVG(rating), 0) FROM recipe_ratings WHERE recipe_id = OLD.recipe_id AND approved = TRUE),
                           updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.recipe_id;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_recipe_rating
    AFTER INSERT OR UPDATE OR DELETE ON recipe_ratings
    FOR EACH ROW EXECUTE FUNCTION update_recipe_rating_stats();

COMMENT ON TABLE recipe_ratings IS 'Calificaciones y reseñas de usuarios';