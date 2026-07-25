-- =====================================================
-- Módulo: Payments
-- Tablas: payments, payment_attempts
-- =====================================================

CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    reference VARCHAR(50) NOT NULL UNIQUE,
    external_reference VARCHAR(100),
    order_id BIGINT NOT NULL,
    order_number VARCHAR(20) NOT NULL,
    user_id BIGINT NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    amount BIGINT NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'COP',
    payment_method VARCHAR(30),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    status_detail VARCHAR(100),
    gateway VARCHAR(20) NOT NULL DEFAULT 'WOMPI',
    gateway_status VARCHAR(50),
    gateway_response JSONB,
    checkout_url TEXT,
    redirect_url TEXT,
    card_last_four VARCHAR(4),
    card_brand VARCHAR(20),
    pse_bank_name VARCHAR(100),
    attempt_count INT NOT NULL DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

CREATE INDEX idx_payments_reference ON payments(reference);
CREATE INDEX idx_payments_external_reference ON payments(external_reference) WHERE external_reference IS NOT NULL;
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_order_number ON payments(order_number);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX idx_payments_expires_at ON payments(expires_at) WHERE status = 'PENDING';

COMMENT ON TABLE payments IS 'Registro principal de pagos';
COMMENT ON COLUMN payments.amount IS 'Monto en centavos (COP sin decimales)';
COMMENT ON COLUMN payments.status IS 'PENDING, PROCESSING, APPROVED, DECLINED, VOIDED, REFUNDED, EXPIRED, ERROR';

-- Intentos de pago
CREATE TABLE payment_attempts (
    id BIGSERIAL PRIMARY KEY,
    payment_id BIGINT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    attempt_number INT NOT NULL,
    payment_method VARCHAR(30),
    gateway_request JSONB,
    gateway_response JSONB,
    status VARCHAR(20) NOT NULL,
    status_detail VARCHAR(255),
    error_code VARCHAR(50),
    error_message TEXT,
    client_ip VARCHAR(50),
    user_agent TEXT,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_payment_attempt_number UNIQUE (payment_id, attempt_number)
);

CREATE INDEX idx_payment_attempts_payment_id ON payment_attempts(payment_id);
CREATE INDEX idx_payment_attempts_status ON payment_attempts(status);

COMMENT ON TABLE payment_attempts IS 'Historial de intentos de pago';
