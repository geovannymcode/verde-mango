-- =====================================================
-- Tags y relación muchos a muchos con recetas
-- =====================================================

CREATE TABLE recipe_tags (
                             id BIGSERIAL PRIMARY KEY,
                             name VARCHAR(50) NOT NULL,
                             slug VARCHAR(60) NOT NULL UNIQUE,

    -- Contadores
                             recipe_count INT NOT NULL DEFAULT 0,

    -- Auditoría
                             created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recipe_tags_slug ON recipe_tags(slug);
CREATE INDEX idx_recipe_tags_count ON recipe_tags(recipe_count DESC);

-- Tabla de relación
CREATE TABLE recipe_tag_assignments (
                                        recipe_id BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
                                        tag_id BIGINT NOT NULL REFERENCES recipe_tags(id) ON DELETE CASCADE,

                                        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                        PRIMARY KEY (recipe_id, tag_id)
);

CREATE INDEX idx_recipe_tag_assignments_tag ON recipe_tag_assignments(tag_id);

-- Trigger para actualizar contador de tags
CREATE OR REPLACE FUNCTION update_tag_recipe_count()
    RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE recipe_tags SET recipe_count = recipe_count + 1 WHERE id = NEW.tag_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE recipe_tags SET recipe_count = recipe_count - 1 WHERE id = OLD.tag_id;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tag_count
    AFTER INSERT OR DELETE ON recipe_tag_assignments
    FOR EACH ROW EXECUTE FUNCTION update_tag_recipe_count();

COMMENT ON TABLE recipe_tags IS 'Tags para clasificar recetas';
COMMENT ON TABLE recipe_tag_assignments IS 'Relación muchos a muchos entre recetas y tags';