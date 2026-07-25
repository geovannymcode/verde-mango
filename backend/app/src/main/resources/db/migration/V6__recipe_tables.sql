-- =====================================================
-- Módulo: Recipes
-- Tablas: recipe_categories, recipes, recipe_steps,
--         recipe_ingredients, recipe_images, recipe_ratings,
--         recipe_tags, recipe_tag_assignments
-- =====================================================

-- Categorías de recetas
CREATE TABLE recipe_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    parent_id BIGINT REFERENCES recipe_categories(id) ON DELETE SET NULL,
    display_order INT NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    recipe_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recipe_categories_slug ON recipe_categories(slug);
CREATE INDEX idx_recipe_categories_parent ON recipe_categories(parent_id);
CREATE INDEX idx_recipe_categories_active ON recipe_categories(active);
CREATE INDEX idx_recipe_categories_order ON recipe_categories(display_order);

COMMENT ON TABLE recipe_categories IS 'Categorías de recetas veganas';

-- Recetas
CREATE TABLE recipes (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(250) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    introduction TEXT,
    tips TEXT,
    prep_time INT NOT NULL DEFAULT 0,
    cook_time INT NOT NULL DEFAULT 0,
    total_time INT GENERATED ALWAYS AS (prep_time + cook_time) STORED,
    servings INT NOT NULL DEFAULT 4,
    servings_unit VARCHAR(50) DEFAULT 'porciones',
    difficulty VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    category_id BIGINT REFERENCES recipe_categories(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    primary_image_url TEXT,
    meta_title VARCHAR(70),
    meta_description VARCHAR(160),
    calories INT,
    protein_grams DECIMAL(5,1),
    carbs_grams DECIMAL(5,1),
    fat_grams DECIMAL(5,1),
    fiber_grams DECIMAL(5,1),
    views BIGINT NOT NULL DEFAULT 0,
    rating_count INT NOT NULL DEFAULT 0,
    rating_average DECIMAL(2,1) NOT NULL DEFAULT 0,
    author_id BIGINT,
    author_name VARCHAR(100),
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recipes_slug ON recipes(slug);
CREATE INDEX idx_recipes_status ON recipes(status);
CREATE INDEX idx_recipes_category ON recipes(category_id);
CREATE INDEX idx_recipes_featured ON recipes(featured) WHERE featured = TRUE;
CREATE INDEX idx_recipes_difficulty ON recipes(difficulty);
CREATE INDEX idx_recipes_published ON recipes(published_at DESC) WHERE status = 'PUBLISHED';
CREATE INDEX idx_recipes_views ON recipes(views DESC);
CREATE INDEX idx_recipes_rating ON recipes(rating_average DESC);
CREATE INDEX idx_recipes_search ON recipes USING gin(
    to_tsvector('spanish', title || ' ' || COALESCE(description, ''))
);

COMMENT ON TABLE recipes IS 'Recetas veganas del blog';
COMMENT ON COLUMN recipes.status IS 'DRAFT, PUBLISHED, ARCHIVED';
COMMENT ON COLUMN recipes.difficulty IS 'EASY, MEDIUM, HARD';

-- Pasos de recetas
CREATE TABLE recipe_steps (
    id BIGSERIAL PRIMARY KEY,
    recipe_id BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    step_number INT NOT NULL,
    instruction TEXT NOT NULL,
    image_url TEXT,
    tip TEXT,
    estimated_time INT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_recipe_steps_number UNIQUE (recipe_id, step_number)
);

CREATE INDEX idx_recipe_steps_recipe ON recipe_steps(recipe_id);

-- Ingredientes de recetas
CREATE TABLE recipe_ingredients (
    id BIGSERIAL PRIMARY KEY,
    recipe_id BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    quantity DECIMAL(10,2),
    unit VARCHAR(50),
    preparation_notes VARCHAR(200),
    ingredient_group VARCHAR(100),
    display_order INT NOT NULL DEFAULT 0,
    optional BOOLEAN NOT NULL DEFAULT FALSE,
    product_id BIGINT,
    product_name VARCHAR(255),
    product_slug VARCHAR(300),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_product ON recipe_ingredients(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX idx_recipe_ingredients_order ON recipe_ingredients(recipe_id, display_order);

COMMENT ON COLUMN recipe_ingredients.product_id IS 'ID del producto en catálogo (para "comprar ingredientes")';

-- Imágenes de recetas
CREATE TABLE recipe_images (
    id BIGSERIAL PRIMARY KEY,
    recipe_id BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(200),
    caption VARCHAR(300),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recipe_images_recipe ON recipe_images(recipe_id);
CREATE INDEX idx_recipe_images_primary ON recipe_images(recipe_id, is_primary) WHERE is_primary = TRUE;

-- Calificaciones de recetas
CREATE TABLE recipe_ratings (
    id BIGSERIAL PRIMARY KEY,
    recipe_id BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL,
    user_name VARCHAR(100),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    made_recipe BOOLEAN DEFAULT FALSE,
    approved BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_recipe_ratings_user UNIQUE (recipe_id, user_id)
);

CREATE INDEX idx_recipe_ratings_recipe ON recipe_ratings(recipe_id);
CREATE INDEX idx_recipe_ratings_user ON recipe_ratings(user_id);
CREATE INDEX idx_recipe_ratings_approved ON recipe_ratings(recipe_id, approved) WHERE approved = TRUE;

-- Trigger para actualizar promedios de rating en recipes
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

-- Tags de recetas
CREATE TABLE recipe_tags (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(60) NOT NULL UNIQUE,
    recipe_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recipe_tags_slug ON recipe_tags(slug);
CREATE INDEX idx_recipe_tags_count ON recipe_tags(recipe_count DESC);

-- Tabla de relación recetas-tags
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
