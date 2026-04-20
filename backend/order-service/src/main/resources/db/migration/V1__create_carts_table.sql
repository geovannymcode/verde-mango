CREATE TABLE carts (
                       id BIGSERIAL PRIMARY KEY,
                       user_id BIGINT,
                       session_id VARCHAR(100),
                       status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
                       expires_at TIMESTAMP WITH TIME ZONE,
                       item_count INT NOT NULL DEFAULT 0,
                       subtotal BIGINT NOT NULL DEFAULT 0,
                       created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

                       CONSTRAINT uq_carts_user_active UNIQUE (user_id, status)
);

CREATE INDEX idx_carts_user_id ON carts(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_carts_session_id ON carts(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_carts_status ON carts(status);
CREATE INDEX idx_carts_expires_at ON carts(expires_at) WHERE expires_at IS NOT NULL;

COMMENT ON TABLE carts IS 'Carritos de compra';
COMMENT ON COLUMN carts.status IS 'ACTIVE, MERGED, CONVERTED, ABANDONED, EXPIRED';