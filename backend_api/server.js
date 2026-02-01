const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const db = require('./db');

// --- MODULES POUR FICHIERS (ZOONING) ---
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(express.json());

// IMPORTANT : On rend le dossier 'uploads' accessible publiquement
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- CONFIGURATION MULTER (Stockage des plans) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/plans';
        // Création du dossier s'il n'existe pas
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Nom unique : timestamp + extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });


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
            SELECT u.*, t.css_value as theme_css_value, r.name as role_name, 
                   r.write, r.read, r.export, r.admin_rights
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
                    id: user.id, identifier: user.identifier, email: user.email, 
                    themeId: user.theme_id, theme: user.theme_css_value || 'light',
                    role_id: user.role_id, role_name: user.role_name,
                    permissions: {
                        write: !!user.write, read: !!user.read,
                        export: !!user.export, admin: !!user.admin_rights
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

// --- ROUTES ADMIN (USER MANAGEMENT) ---
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

// --- ROUTES ZOONING (PLANS) ---

// 1. Upload
app.post('/zooning/upload', upload.single('planImage'), async (req, res) => {
    const { name } = req.body;
    const file = req.file;

    if (!file || !name) return res.status(400).json({ error: "Nom et image requis." });

    // Lien relatif pour le frontend (ex: /uploads/plans/abc.jpg)
    const imgLink = `/uploads/plans/${file.filename}`;

    try {
        await db.query('INSERT INTO plans (name, img_link) VALUES (?, ?)', [name, imgLink]);
        res.status(201).json({ message: "Plan ajouté !", link: imgLink });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur base de données" });
    }
});

// 2. Liste des plans
app.get('/zooning/plans', async (req, res) => {
    try {
        const [plans] = await db.query('SELECT * FROM plans ORDER BY id DESC');
        res.json(plans);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur récupération plans" });
    }
});

// 3. Supprimer un plan
app.delete('/zooning/plan/:id', async (req, res) => {
    const planId = req.params.id;

    try {
        // Etape 1 : On récupère le lien de l'image avant de supprimer la ligne en BDD
        const [rows] = await db.query('SELECT img_link FROM plans WHERE id = ?', [planId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: "Plan introuvable." });
        }

        const relativePath = rows[0].img_link; // ex: /uploads/plans/123.jpg
        
        // Etape 2 : On reconstruit le chemin absolu sur le serveur
        // __dirname est le dossier actuel du serveur
        const fullPath = path.join(__dirname, relativePath);

        // Etape 3 : On supprime le fichier s'il existe
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath); // Suppression physique
        }

        // Etape 4 : On supprime la ligne en base de données
        await db.query('DELETE FROM plans WHERE id = ?', [planId]);

        res.json({ message: "Plan supprimé avec succès." });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur lors de la suppression." });
    }
});

// Route password
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