USE health_check_360_db;

-- 1. Création de la table des Thèmes (Indispensable pour la clé étrangère)
CREATE TABLE IF NOT EXISTS themes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,       -- Nom affiché (ex: Clair)
    css_value VARCHAR(50) NOT NULL   -- Valeur technique (ex: light)
);

-- On insère les thèmes de base
INSERT IGNORE INTO themes (name, css_value) VALUES 
('Clair', 'light'),
('Sombre', 'dark');

-- 2. Création de la table Users avec la Clé Étrangère
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    identifier VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_type ENUM('admin', 'user') DEFAULT 'user',
    
    -- La colonne qui fait le lien
    theme_id INT DEFAULT 1, 
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- DÉFINITION DE LA CLÉ ÉTRANGÈRE
    -- Cela oblige theme_id à correspondre à un id existant dans la table themes
    FOREIGN KEY (theme_id) REFERENCES themes(id)
);

-- Création de l'Admin par défaut (Lié au thème 2 -> Sombre)
INSERT IGNORE INTO users (identifier, email, password_hash, role_type, theme_id) 
VALUES ('SuperAdmin', 'admin@healthcheck.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxwKc.6IyiGA.abojy./y.7.u7yACH', 'admin', 2);