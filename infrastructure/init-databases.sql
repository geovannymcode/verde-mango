-- Crear bases de datos para cada microservicio
CREATE DATABASE auth_db;
CREATE DATABASE product_db;
CREATE DATABASE order_db;
CREATE DATABASE recipe_db;
CREATE DATABASE payment_db;

-- Grants (opcional, para usuarios separados)
-- CREATE USER auth_user WITH PASSWORD 'auth_pass';
-- GRANT ALL PRIVILEGES ON DATABASE auth_db TO auth_user;