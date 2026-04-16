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
                        billing_city VARCHAR(100),
                        billing_state VARCHAR(100),
                        billing_postal_code VARCHAR(20),
                        billing_country VARCHAR(100),
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

                        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_user_email ON orders(user_email);