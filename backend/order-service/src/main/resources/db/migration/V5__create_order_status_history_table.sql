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

COMMENT ON COLUMN order_status_history.changed_by_type IS 'SYSTEM, USER, ADMIN, PAYMENT_WEBHOOK';