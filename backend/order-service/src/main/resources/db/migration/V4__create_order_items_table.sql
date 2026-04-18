CREATE TABLE order_items (
                             id BIGSERIAL PRIMARY KEY,
                             order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
                             product_id BIGINT NOT NULL,
                             product_name VARCHAR(255) NOT NULL,
                             product_slug VARCHAR(300) NOT NULL,
                             product_sku VARCHAR(100),
                             product_image_url TEXT,
                             quantity INT NOT NULL CHECK (quantity > 0),
                             unit_price BIGINT NOT NULL CHECK (unit_price >= 0),
                             subtotal BIGINT NOT NULL CHECK (subtotal >= 0),
                             discount_amount BIGINT NOT NULL DEFAULT 0,
                             created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                             updated_at TIMESTAMP
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);