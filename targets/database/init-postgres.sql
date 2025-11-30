-- PostgreSQL Initialization Script for PAM-Vault-Lab
-- Creates sample tables and data for testing

-- Create sample table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sample table for secrets
CREATE TABLE IF NOT EXISTS application_secrets (
    id SERIAL PRIMARY KEY,
    app_name VARCHAR(100) NOT NULL,
    secret_key VARCHAR(255) NOT NULL,
    environment VARCHAR(20) DEFAULT 'dev',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO users (username, email) VALUES
    ('alice', 'alice@lab.local'),
    ('bob', 'bob@lab.local'),
    ('charlie', 'charlie@lab.local')
ON CONFLICT (username) DO NOTHING;

INSERT INTO application_secrets (app_name, secret_key, environment) VALUES
    ('webapp', 'secret_key_webapp_dev', 'dev'),
    ('api', 'secret_key_api_dev', 'dev'),
    ('webapp', 'secret_key_webapp_prod', 'prod')
ON CONFLICT DO NOTHING;

-- Grant permissions (for dynamic role creation)
GRANT ALL PRIVILEGES ON DATABASE testdb TO vaultadmin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO vaultadmin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO vaultadmin;

-- Display success message
DO $$
BEGIN
    RAISE NOTICE 'PostgreSQL initialized successfully for PAM-Vault-Lab';
END $$;
