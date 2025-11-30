-- MySQL Initialization Script for PAM-Vault-Lab
-- Creates sample tables and data for testing

USE testdb;

-- Create sample table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sample table for secrets
CREATE TABLE IF NOT EXISTS application_secrets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    app_name VARCHAR(100) NOT NULL,
    secret_key VARCHAR(255) NOT NULL,
    environment VARCHAR(20) DEFAULT 'dev',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT IGNORE INTO users (username, email) VALUES
    ('alice', 'alice@lab.local'),
    ('bob', 'bob@lab.local'),
    ('charlie', 'charlie@lab.local');

INSERT IGNORE INTO application_secrets (app_name, secret_key, environment) VALUES
    ('webapp', 'secret_key_webapp_dev', 'dev'),
    ('api', 'secret_key_api_dev', 'dev'),
    ('webapp', 'secret_key_webapp_prod', 'prod');

-- Grant permissions for vault user
GRANT ALL PRIVILEGES ON testdb.* TO 'vaultuser'@'%';
FLUSH PRIVILEGES;

SELECT 'MySQL initialized successfully for PAM-Vault-Lab' AS message;
