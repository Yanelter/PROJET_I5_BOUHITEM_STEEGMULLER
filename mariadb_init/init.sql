USE health_check_360_db;

-- 1. Table Thèmes
CREATE TABLE IF NOT EXISTS themes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    css_value VARCHAR(50) NOT NULL
);
INSERT IGNORE INTO themes (name, css_value) VALUES ('Clair', 'light'), ('Sombre', 'dark');

-- 2. Table Rôles
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    can_write BOOLEAN DEFAULT 0,
    can_read BOOLEAN DEFAULT 1,
    can_export BOOLEAN DEFAULT 0,
    admin_rights BOOLEAN DEFAULT 0
);

INSERT IGNORE INTO roles (id, name, can_write, can_read, can_export, admin_rights) VALUES 
(1, 'Lecteur', 0, 1, 0, 0),
(2, 'Lecteur Avancé', 0, 1, 1, 0),
(3, 'Operateur', 1, 1, 1, 0),
(4, 'Administrateur', 1, 1, 1, 1),
(5, 'Super Administrateur', 1, 1, 1, 1);

-- 3. Table Plans
CREATE TABLE IF NOT EXISTS plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    img_link VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Table Type d'équipements
CREATE TABLE IF NOT EXISTS type_equipements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    equipement_val ENUM('binary', 'analog') DEFAULT 'binary',
    symbol VARCHAR(50) NOT NULL,
    comment VARCHAR(255)
);

-- 5. Table Users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    identifier VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT DEFAULT 1,
    theme_id INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (theme_id) REFERENCES themes(id)
);

-- Création des SuperAdmin (MS et YB)
-- Note : Vérifiez que le hash correspond bien au mot de passe que vous souhaitez
INSERT IGNORE INTO users (identifier, email, password_hash, role_id, theme_id) 
VALUES 
('MS', 'manon.steegmuller@etu.unilasalle.fr', '$2b$10$nFJ1ojKfi.QJYkQ/ZQTzf.qJ8j08MsswHEnNUosI1cAIk5JFq9.UG', 5, 2),
('YB', 'yanel.bouhitem@etu.unilasalle.fr', '$2b$10$nFJ1ojKfi.QJYkQ/ZQTzf.qJ8j08MsswHEnNUosI1cAIk5JFq9.UG', 5, 2);

-- 6. Table Equipements Terrain
CREATE TABLE IF NOT EXISTS equipements_terrain (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    
    analog_value FLOAT DEFAULT NULL,
    bool_value BOOLEAN DEFAULT NULL,
    
    plans_id INT NOT NULL,
    zone VARCHAR(100),
    x_axis FLOAT DEFAULT 0,
    y_axis FLOAT DEFAULT 0,
    
    type_equipements_id INT NOT NULL,
    comment VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (type_equipements_id) REFERENCES type_equipements(id),
    FOREIGN KEY (plans_id) REFERENCES plans(id) ON DELETE CASCADE
);


-- 7. Table des Demandes de Rondes
CREATE TABLE IF NOT EXISTS demande_rondes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    operator_id INT NOT NULL, -- Qui fait la ronde
    creator_id INT NOT NULL,  -- Qui a créé la demande (Admin)
    scheduled_date DATE NOT NULL,
    target_equipments_ids JSON, -- On stocke la liste des IDs des équipements à vérifier (ex: "[1, 5, 12]")
    status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (operator_id) REFERENCES users(id),
    FOREIGN KEY (creator_id) REFERENCES users(id)
);


-- 8. Table des Rapports de Rondes (Réponses)
CREATE TABLE IF NOT EXISTS rapport_rondes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    demande_ronde_id INT NOT NULL,
    operator_id INT NOT NULL, -- L'opérateur qui a réalisé la ronde
    report_data JSON, -- On stocke les réponses en JSON : Ex: [{"id": 1, "value": 24.5, "comment": "RAS"}, {"id": 2, "value": 1, "comment": ""}]
    etat ENUM('valide', 'obsolete', 'modifie') DEFAULT 'valide', -- Colonne demandée
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (demande_ronde_id) REFERENCES demande_rondes(id),
    FOREIGN KEY (operator_id) REFERENCES users(id)
);