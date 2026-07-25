-- =====================================================
-- Módulo: Orders
-- Tablas: carts, cart_items, orders, order_items, order_status_history
-- =====================================================

-- Carritos
CREATE TABLE carts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    session_id VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    expires_at TIMESTAMP WITH TIME ZONE,
    item_count INT NOT NULL DEFAULT 0,
    subtotal BIGINT NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX uq_carts_user_active_partial ON carts(user_id)
    WHERE status = 'ACTIVE' AND user_id IS NOT NULL;
CREATE INDEX idx_carts_user_id ON carts(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_carts_session_id ON carts(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_carts_status ON carts(status);
CREATE INDEX idx_carts_expires_at ON carts(expires_at) WHERE expires_at IS NOT NULL;

COMMENT ON TABLE carts IS 'Carritos de compra';
COMMENT ON COLUMN carts.status IS 'ACTIVE, MERGED, CONVERTED, ABANDONED, EXPIRED';

-- Items del carrito
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

-- Órdenes
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(20) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',

    -- Totales
    subtotal BIGINT NOT NULL CHECK (subtotal >= 0),
    shipping_cost BIGINT NOT NULL DEFAULT 0,
    tax_amount BIGINT NOT NULL DEFAULT 0,
    discount_amount BIGINT NOT NULL DEFAULT 0,
    total_amount BIGINT NOT NULL CHECK (total_amount >= 0),
    item_count INT NOT NULL DEFAULT 0,

    -- Dirección de envío
    shipping_recipient_name VARCHAR(200) NOT NULL,
    shipping_phone VARCHAR(20) NOT NULL,
    shipping_street_address VARCHAR(500) NOT NULL,
    shipping_apartment VARCHAR(100),
    shipping_city VARCHAR(100) NOT NULL,
    shipping_state VARCHAR(100),
    shipping_postal_code VARCHAR(20),
    shipping_country VARCHAR(100) NOT NULL DEFAULT 'Colombia',
    shipping_instructions TEXT,

    -- Facturación
    billing_same_as_shipping BOOLEAN NOT NULL DEFAULT TRUE,
    billing_recipient_name VARCHAR(200),
    billing_phone VARCHAR(20),
    billing_street_address VARCHAR(500),
    billing_apartment VARCHAR(100),
    billing_city VARCHAR(100),
    billing_state VARCHAR(100),
    billing_postal_code VARCHAR(20),
    billing_country VARCHAR(100),
    billing_instructions TEXT,
    billing_tax_id VARCHAR(50),

    -- Pago
    payment_id BIGINT,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    paid_at TIMESTAMP WITH TIME ZONE,

    -- Envío
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    tracking_number VARCHAR(100),
    carrier VARCHAR(100),

    -- Cancelación
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    refunded_at TIMESTAMP WITH TIME ZONE,
    refund_amount BIGINT,

    -- Notas
    customer_notes TEXT,
    internal_notes TEXT,
    cart_id BIGINT,
    version BIGINT NOT NULL DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_user_email ON orders(user_email);

-- Items de la orden
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
    updated_at TIMESTAMP,
    CONSTRAINT chk_order_items_discount_amount CHECK (discount_amount >= 0)
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Historial de estado de órdenes
CREATE TABLE order_status_history (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    from_status VARCHAR(20),
    to_status VARCHAR(20) NOT NULL,
    comment TEXT,
    changed_by_user_id BIGINT,
    changed_by_type VARCHAR(20) NOT NULL DEFAULT 'SYSTEM',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX idx_order_status_history_created_at ON order_status_history(created_at DESC);
CREATE INDEX idx_order_status_history_order_created ON order_status_history(order_id, created_at DESC);

COMMENT ON COLUMN order_status_history.changed_by_type IS 'SYSTEM, USER, ADMIN, PAYMENT_WEBHOOK';
