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

// --- ROUTES THEMES ---
app.get('/themes', async (req, res) => {
    try {
        const [themes] = await db.query('SELECT id, name, css_value FROM themes');
        res.json(themes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur récupération thèmes" });
    }
});

app.put('/user/theme', async (req, res) => {
    const { userId, themeId } = req.body;
    try {
        await db.query('UPDATE users SET theme_id = ? WHERE id = ?', [themeId, userId]);
        const [rows] = await db.query('SELECT css_value FROM themes WHERE id = ?', [themeId]);
        res.json({ message: "Thème mis à jour", cssValue: rows[0]?.css_value || 'light' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur mise à jour thème" });
    }
});

// --- ROUTE REGISTER ---
app.post('/register', async (req, res) => {
    const { identifier, email, password } = req.body;

    if (!identifier || !email || !password) return res.status(400).json({ error: "Champs manquants" });

    try {
        const hash = await bcrypt.hash(password, 10);
        // On insère avec role_id = 2 (Utilisateur) par défaut
        const [result] = await db.query(
            'INSERT INTO users (identifier, email, password_hash, role_id, theme_id) VALUES (?, ?, ?, ?, ?)',
            [identifier, email, hash, 2, 1]
        );
        res.status(201).json({ message: "Utilisateur créé !", userId: result.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: "Compte existant." });
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// --- ROUTE LOGIN ---
app.post('/login', async (req, res) => {
    const { login, password } = req.body;

    try {
        const query = `
            SELECT 
                u.*, 
                t.css_value as theme_css_value,
                r.name as role_name,
                r.write,
                r.read,
                r.export,
                r.admin_rights
            FROM users u 
            LEFT JOIN themes t ON u.theme_id = t.id 
            LEFT JOIN roles r ON u.role_id = r.id 
            WHERE u.email = ? OR u.identifier = ?
        `;

        const [users] = await db.query(query, [login, login]);
        
        if (users.length === 0) return res.status(401).json({ error: "Utilisateur introuvable..." });

        const user = users[0];
        const match = await bcrypt.compare(password, user.password_hash);

        if (match) {
            res.json({ 
                message: "Connexion réussie !", 
                user: { 
                    id: user.id, 
                    identifier: user.identifier,
                    email: user.email, 
                    themeId: user.theme_id,
                    theme: user.theme_css_value || 'light',
                    role_id: user.role_id,
                    role_name: user.role_name,
                    permissions: {
                        write: !!user.write,
                        read: !!user.read,
                        export: !!user.export,
                        admin: !!user.admin_rights
                    }
                } 
            });
        } else {
            res.status(401).json({ error: "Mot de passe incorrect" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// --- ZONE SUPER ADMINISTRATEUR (GESTION UTILISATEURS) ---

// A. Récupérer tous les utilisateurs (pour l'app 'Utilisateurs')
app.get('/admin/users', async (req, res) => {
    try {
        // On récupère tout sauf le mot de passe
        const query = `
            SELECT u.id, u.identifier, u.email, u.created_at, u.role_id, r.name as role_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            ORDER BY u.id ASC
        `;
        const [users] = await db.query(query);
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur récupération utilisateurs" });
    }
});

// B. Récupérer la liste des rôles disponibles
app.get('/roles', async (req, res) => {
    try {
        const [roles] = await db.query('SELECT * FROM roles ORDER BY id ASC');
        res.json(roles);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur récupération rôles" });
    }
});

// C. Modifier le rôle d'un utilisateur
app.put('/admin/update-role', async (req, res) => {
    const { targetUserId, newRoleId, requesterRoleId } = req.body;

    // 1. Sécurité : Le demandeur doit être Super Admin (ID 5)
    if (parseInt(requesterRoleId) !== 5) {
        return res.status(403).json({ error: "Action non autorisée." });
    }

    try {
        // 2. Sécurité : On vérifie si la CIBLE est un Super Admin
        const [targetUser] = await db.query('SELECT role_id FROM users WHERE id = ?', [targetUserId]);
        
        if (targetUser.length === 0) return res.status(404).json({ error: "Utilisateur introuvable" });

        // Si la cible est DÉJÀ Super Admin (ID 5), on interdit la modification
        if (targetUser[0].role_id === 5) {
            return res.status(403).json({ error: "Impossible de modifier un Super Administrateur." });
        }

        // 3. Mise à jour
        await db.query('UPDATE users SET role_id = ? WHERE id = ?', [newRoleId, targetUserId]);
        res.json({ message: "Rôle mis à jour avec succès" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// (La route user/password reste inchangée, gardez-la si elle y était)
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});