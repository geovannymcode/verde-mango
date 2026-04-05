CREATE TABLE users (
                       id BIGSERIAL PRIMARY KEY,
                       email VARCHAR(255) NOT NULL UNIQUE,
                       password_hash VARCHAR(255) NOT NULL,
                       first_name VARCHAR(100) NOT NULL,
                       last_name VARCHAR(100) NOT NULL,
                       phone VARCHAR(20),
                       role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',
                       email_verified BOOLEAN NOT NULL DEFAULT FALSE,
                       active BOOLEAN NOT NULL DEFAULT TRUE,
                       avatar_url TEXT,
                       created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(active);

-- Usuario admin inicial
INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified)
VALUES (
           'admin@verdemango.com',
           '$2a$10$jgI.OYN/.gsqc18uZKffUuJ37dXyvFLXML2rnmq4dVzLvPz6esy.a',
           'Admin',
           'Verde Mango',
           'SUPER_ADMIN',
           TRUE
       );