CREATE TABLE cart_items (
                            id BIGSERIAL PRIMARY KEY,
                            cart_id BIGINT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
                            product_id BIGINT NOT NULL,
                            product_name VARCHAR(255) NOT NULL,
                            product_slug VARCHAR(300) NOT NULL,
                            product_image_url TEXT,
                            quantity INT NOT NULL CHECK (quantity > 0),
                            unit_price BIGINT NOT NULL CHECK (unit_price >= 0),
                            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

                            CONSTRAINT uq_cart_items_product UNIQUE (cart_id, product_id)
);

CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);