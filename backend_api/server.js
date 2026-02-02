const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const db = require('./db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- CONFIGURATION MULTER ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/plans';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

app.get('/', (req, res) => { res.send("Backend HealthCheck360 fonctionnel !"); });

// --- ROUTES THEMES ---
app.get('/themes', async (req, res) => {
    try {
        const [themes] = await db.query('SELECT id, name, css_value FROM themes');
        res.json(themes);
    } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

app.put('/user/theme', async (req, res) => {
    const { userId, themeId } = req.body;
    try {
        await db.query('UPDATE users SET theme_id = ? WHERE id = ?', [themeId, userId]);
        const [rows] = await db.query('SELECT css_value FROM themes WHERE id = ?', [themeId]);
        res.json({ message: "Thème mis à jour", cssValue: rows[0]?.css_value || 'light' });
    } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

// --- ROUTES AUTH ---
app.post('/register', async (req, res) => {
    const { identifier, email, password } = req.body;
    if (!identifier || !email || !password) return res.status(400).json({ error: "Champs manquants" });
    try {
        const hash = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO users (identifier, email, password_hash, role_id, theme_id) VALUES (?, ?, ?, ?, ?)',
            [identifier, email, hash, 2, 1]
        );
        res.status(201).json({ message: "Utilisateur créé !", userId: result.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: "Compte existant." });
        res.status(500).json({ error: "Erreur serveur" });
    }
});

app.post('/login', async (req, res) => {
    const { login, password } = req.body;
    try {
        const query = `
            SELECT u.*, t.css_value as theme_css_value, r.name as role_name, 
                   r.write, r.read, r.export, r.admin_rights
            FROM users u 
            LEFT JOIN themes t ON u.theme_id = t.id 
            LEFT JOIN roles r ON u.role_id = r.id 
            WHERE u.email = ? OR u.identifier = ?
        `;
        const [users] = await db.query(query, [login, login]);
        if (users.length === 0) return res.status(401).json({ error: "Introuvable" });

        const user = users[0];
        const match = await bcrypt.compare(password, user.password_hash);

        if (match) {
            res.json({ 
                message: "Connexion réussie !", 
                user: { 
                    id: user.id, identifier: user.identifier, email: user.email, 
                    themeId: user.theme_id, theme: user.theme_css_value || 'light',
                    role_id: user.role_id, role_name: user.role_name,
                    permissions: {
                        write: !!user.write, read: !!user.read,
                        export: !!user.export, admin: !!user.admin_rights
                    }
                } 
            });
        } else { res.status(401).json({ error: "Mot de passe incorrect" }); }
    } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

app.put('/user/password', async (req, res) => { /* Code password inchangé */ });

// --- ROUTES ADMIN ---
app.get('/admin/users', async (req, res) => {
    try {
        const query = `SELECT u.id, u.identifier, u.email, u.created_at, u.role_id, r.name as role_name 
                       FROM users u LEFT JOIN roles r ON u.role_id = r.id ORDER BY u.id ASC`;
        const [users] = await db.query(query);
        res.json(users);
    } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

app.get('/roles', async (req, res) => {
    try {
        const [roles] = await db.query('SELECT * FROM roles ORDER BY id ASC');
        res.json(roles);
    } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

app.put('/admin/update-role', async (req, res) => {
    const { targetUserId, newRoleId, requesterRoleId } = req.body;
    if (parseInt(requesterRoleId) !== 5) return res.status(403).json({ error: "Non autorisé." });
    try {
        const [targetUser] = await db.query('SELECT role_id FROM users WHERE id = ?', [targetUserId]);
        if (targetUser.length === 0) return res.status(404).json({ error: "Introuvable" });
        if (targetUser[0].role_id === 5) return res.status(403).json({ error: "Impossible de modifier un Super Admin." });
        await db.query('UPDATE users SET role_id = ? WHERE id = ?', [newRoleId, targetUserId]);
        res.json({ message: "Rôle mis à jour" });
    } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

// --- ROUTES ZOONING ---
app.post('/zooning/upload', upload.single('planImage'), async (req, res) => {
    const { name } = req.body;
    const file = req.file;
    if (!file || !name) return res.status(400).json({ error: "Nom et image requis." });
    const imgLink = `/uploads/plans/${file.filename}`;
    try {
        await db.query('INSERT INTO plans (name, img_link) VALUES (?, ?)', [name, imgLink]);
        res.status(201).json({ message: "Plan ajouté !", link: imgLink });
    } catch (err) { res.status(500).json({ error: "Erreur BDD" }); }
});

app.get('/zooning/plans', async (req, res) => {
    try {
        const [plans] = await db.query('SELECT * FROM plans ORDER BY id DESC');
        res.json(plans);
    } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

app.delete('/zooning/plan/:id', async (req, res) => {
    const planId = req.params.id;
    try {
        const [rows] = await db.query('SELECT img_link FROM plans WHERE id = ?', [planId]);
        if (rows.length === 0) return res.status(404).json({ error: "Plan introuvable." });
        const fullPath = path.join(__dirname, rows[0].img_link);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        await db.query('DELETE FROM plans WHERE id = ?', [planId]);
        res.json({ message: "Plan supprimé." });
    } catch (err) { res.status(500).json({ error: "Erreur suppression." }); }
});

// --- ROUTES ÉQUIPEMENTS (NOUVEAU) ---

// 1. Récupérer tous
app.get('/equipements', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM type_equipements ORDER BY id DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

// 2. Créer
app.post('/equipements', async (req, res) => {
    const { name, equipement_val, symbol, comment } = req.body;
    if (!name || !symbol) return res.status(400).json({ error: "Nom et Symbole requis." });
    try {
        await db.query(
            'INSERT INTO type_equipements (name, equipement_val, symbol, comment) VALUES (?, ?, ?, ?)',
            [name, equipement_val || 'bool', symbol, comment]
        );
        res.status(201).json({ message: "Équipement créé." });
    } catch (err) { res.status(500).json({ error: "Erreur création." }); }
});

// 3. Supprimer
app.delete('/equipements/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM type_equipements WHERE id = ?', [req.params.id]);
        res.json({ message: "Équipement supprimé." });
    } catch (err) { res.status(500).json({ error: "Erreur suppression." }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});