-- V7: Schema improvements based on code review

-- 0. Add version column to carts for optimistic locking
ALTER TABLE carts ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

-- 1. Replace full unique constraint with partial unique index for active carts only
-- This allows a user to have multiple non-active carts (MERGED, CONVERTED, etc.)
ALTER TABLE carts DROP CONSTRAINT IF EXISTS uq_carts_user_active;
CREATE UNIQUE INDEX uq_carts_user_active_partial ON carts(user_id)
    WHERE status = 'ACTIVE' AND user_id IS NOT NULL;

-- 2. Add CHECK constraint on order_items.discount_amount to prevent negative values
ALTER TABLE order_items ADD CONSTRAINT chk_order_items_discount_amount
    CHECK (discount_amount >= 0);

-- 3. Composite index on order_status_history for efficient lookups
CREATE INDEX idx_order_status_history_order_created
    ON order_status_history(order_id, created_at DESC);

-- 4. Replace generate_order_number with advisory lock version to prevent race conditions
CREATE OR REPLACE FUNCTION generate_order_number(prefix VARCHAR DEFAULT 'VM')
    RETURNS VARCHAR AS $$
DECLARE
    today_date VARCHAR;
    seq_num INT;
BEGIN
    today_date := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');

    -- Advisory lock keyed on date hash to serialize concurrent calls
    PERFORM pg_advisory_xact_lock(hashtext(prefix || today_date));

    SELECT COALESCE(MAX(
                            CAST(SPLIT_PART(order_number, '-', 3) AS INT)
                    ), 0) + 1
    INTO seq_num
    FROM orders
    WHERE order_number LIKE prefix || '-' || today_date || '-%';

    RETURN prefix || '-' || today_date || '-' || LPAD(seq_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;
