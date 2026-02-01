USE health_check_360_db;

-- 1. Table Thèmes
CREATE TABLE IF NOT EXISTS themes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    css_value VARCHAR(50) NOT NULL
);

INSERT IGNORE INTO themes (name, css_value) VALUES ('Clair', 'light'), ('Sombre', 'dark');

-- 2. NOUVEAU : Table Roles
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    `write` BOOLEAN DEFAULT 0,
    `read` BOOLEAN DEFAULT 1,
    `export` BOOLEAN DEFAULT 0,
    admin_rights BOOLEAN DEFAULT 0
);

-- Insertion des rôles par défaut
-- ID 1 : Lecteur (Lecture seule)
INSERT IGNORE INTO roles (id, name, `write`, `read`, `export`, admin_rights) 
VALUES (1, 'Lecteur', 0, 1, 0, 0);

-- ID 2 : Lecteur Avancé (Lecture et Export)
INSERT IGNORE INTO roles (id, name, `write`, `read`, `export`, admin_rights) 
VALUES (2, 'Lecteur Avancé', 0, 1, 1, 0);

-- ID 3 : Opérateur
INSERT IGNORE INTO roles (id, name, `write`, `read`, `export`, admin_rights) 
VALUES (3, 'Operateur', 1, 1, 1, 0);

-- ID 4 : Administrateur (Tous droits)
INSERT IGNORE INTO roles (id, name, `write`, `read`, `export`, admin_rights) 
VALUES (4, 'Administrateur', 1, 1, 1, 1);

-- ID 5 : Super Administrateur (Tous droits)
INSERT IGNORE INTO roles (id, name, `write`, `read`, `export`, admin_rights) 
VALUES (5, 'Super Administrateur', 1, 1, 1, 1);




-- 3. Table Users (Modifiée)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    identifier VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT DEFAULT 1, -- Par défaut ID 1 (Lecteur)
    theme_id INT DEFAULT 1, -- Par défaut ID 1 (Clair)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (theme_id) REFERENCES themes(id)
);

-- Création du SuperAdmin (Role 1, Theme 2)
INSERT IGNORE INTO users (identifier, email, password_hash, role_id, theme_id) 
VALUES ('MS', 'manon.steegmuller@etu.unilasalle.fr', '', 5, 2);