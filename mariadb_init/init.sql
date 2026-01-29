-- init.sql

-- On s'assure d'utiliser la bonne base (définie dans docker-compose)
USE health_check_360_db;

-- Création de la table users si elle n'existe pas
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    identifier VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_type ENUM('admin', 'user') DEFAULT 'user',
    color_theme ENUM('clair', 'sombre') DEFAULT 'clair',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin par défaut (Mot de passe: password123)
-- Notez l'ajout de 'identifier', 'role_type' et 'color_theme'
INSERT IGNORE INTO users (identifier, email, password_hash, role_type, color_theme) 
VALUES ('SuperAdmin', 'admin@healthcheck.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxwKc.6IyiGA.abojy./y.7.u7yACH', 'admin', 'sombre');