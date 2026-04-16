-- Función para generar número de orden
CREATE OR REPLACE FUNCTION generate_order_number(prefix VARCHAR DEFAULT 'VM')
    RETURNS VARCHAR AS $$
DECLARE
    today_date VARCHAR;
    seq_num INT;
BEGIN
    today_date := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');

    SELECT COALESCE(MAX(
                            CAST(SPLIT_PART(order_number, '-', 3) AS INT)
                    ), 0) + 1
    INTO seq_num
    FROM orders
    WHERE order_number LIKE prefix || '-' || today_date || '-%';

    RETURN prefix || '-' || today_date || '-' || LPAD(seq_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON carts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();