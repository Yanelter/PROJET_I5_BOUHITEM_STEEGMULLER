const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const db = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send("Backend HealthCheck360 fonctionnel !");
});

// --- 1. Route THÈMES (Pour le menu déroulant) ---
app.get('/themes', async (req, res) => {
    try {
        const [themes] = await db.query('SELECT id, name, css_value FROM themes');
        res.json(themes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur récupération thèmes" });
    }
});

// --- 2. Route MISE À JOUR THÈME (C'est ici que ça bloquait) ---
app.put('/user/theme', async (req, res) => {
    const { userId, themeId } = req.body;
    try {
        // Etape A : On enregistre l'ID (le chiffre) dans la table users
        await db.query('UPDATE users SET theme_id = ? WHERE id = ?', [themeId, userId]);
        
        // Etape B : IMPORTANT -> On va chercher la valeur 'light' ou 'dark' associée à cet ID
        const [rows] = await db.query('SELECT css_value FROM themes WHERE id = ?', [themeId]);
        
        // Etape C : On renvoie cette valeur textuelle au Frontend
        // Le Frontend recevra { cssValue: 'dark' } et pourra changer la couleur
        res.json({ 
            message: "Thème mis à jour", 
            cssValue: rows[0]?.css_value || 'light' 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur mise à jour thème" });
    }
});

// --- 3. Route CHANGEMENT MOT DE PASSE ---
app.put('/user/password', async (req, res) => {
    const { userId, currentPassword, newPassword } = req.body;
    try {
        const [users] = await db.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
        if (users.length === 0) return res.status(404).json({ error: "Utilisateur introuvable" });

        const user = users[0];
        const match = await bcrypt.compare(currentPassword, user.password_hash);
        
        if (!match) return res.status(401).json({ error: "Le mot de passe actuel est incorrect." });

        const newHash = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);

        res.json({ message: "Mot de passe modifié avec succès." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// --- 4. Route REGISTER ---
app.post('/register', async (req, res) => {
    const { identifier, email, password } = req.body;

    if (!identifier || !email || !password) {
        return res.status(400).json({ error: "Identifiant, email et mot de passe requis" });
    }

    try {
        const hash = await bcrypt.hash(password, 10);
        // On force le theme_id = 1 (Clair) par défaut
        const [result] = await db.query(
            'INSERT INTO users (identifier, email, password_hash, role_type, theme_id) VALUES (?, ?, ?, ?, ?)',
            [identifier, email, hash, 'user', 1]
        );

        res.status(201).json({ message: "Utilisateur créé !", userId: result.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: "Email ou Identifiant déjà utilisé." });
        }
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// --- 5. Route LOGIN (Doit aussi faire la traduction ID -> Texte) ---
app.post('/login', async (req, res) => {
    const { login, password } = req.body;

    try {
        // SQL AVANCÉ : On fait une JOINTURE (LEFT JOIN) avec la table themes
        // Cela nous permet de récupérer 'css_value' en même temps que les infos user
        const [users] = await db.query(
            `SELECT u.*, t.css_value as theme_css_value 
             FROM users u 
             LEFT JOIN themes t ON u.theme_id = t.id 
             WHERE u.email = ? OR u.identifier = ?`, 
            [login, login]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ error: "Utilisateur introuvable ou mot de passe incorrect" });
        }

        const user = users[0];
        const match = await bcrypt.compare(password, user.password_hash);

        if (match) {
            res.json({ 
                message: "Connexion réussie !", 
                user: { 
                    id: user.id, 
                    identifier: user.identifier,
                    email: user.email, 
                    role: user.role_type,
                    themeId: user.theme_id,               // ID (Chiffre) pour le select
                    theme: user.theme_css_value || 'light' // VALEUR (Texte) pour le CSS
                } 
            });
        } else {
            res.status(401).json({ error: "Utilisateur introuvable ou mot de passe incorrect" });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});