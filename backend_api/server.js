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
                   r.can_write as "write", 
                   r.can_read as "read", 
                   r.can_export as "export", 
                   r.admin_rights
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
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" }); 
    }
});

app.put('/user/password', async (req, res) => {
    const { userId, currentPassword, newPassword } = req.body;
    try {
        const [users] = await db.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
        if (users.length === 0) return res.status(404).json({ error: "Utilisateur introuvable" });
        const match = await bcrypt.compare(currentPassword, users[0].password_hash);
        if (!match) return res.status(401).json({ error: "Mot de passe incorrect" });
        const newHash = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);
        res.json({ message: "Succès." });
    } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

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

// --- ROUTES ZOONING (PLANS) ---
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

// --- ROUTES TYPES D'ÉQUIPEMENTS ---
app.get('/equipements', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM type_equipements ORDER BY id DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

app.post('/equipements', async (req, res) => {
    const { name, equipement_val, symbol, comment } = req.body;
    if (!name || !symbol) return res.status(400).json({ error: "Nom et Symbole requis." });
    try {
        await db.query(
            'INSERT INTO type_equipements (name, equipement_val, symbol, comment) VALUES (?, ?, ?, ?)',
            [name, equipement_val || 'binary', symbol, comment]
        );
        res.status(201).json({ message: "Équipement créé." });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: "Erreur création." }); 
    }
});

app.delete('/equipements/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM type_equipements WHERE id = ?', [req.params.id]);
        res.json({ message: "Équipement supprimé." });
    } catch (err) { res.status(500).json({ error: "Erreur suppression." }); }
});

// --- ROUTES TERRAIN (INSTANCES SUR PLAN) ---
app.get('/terrain/plan/:planId', async (req, res) => {
    try {
        const query = `
            SELECT t.*, type.symbol, type.name as type_name, type.equipement_val
            FROM equipements_terrain t
            JOIN type_equipements type ON t.type_equipements_id = type.id
            WHERE t.plans_id = ?
        `;
        const [rows] = await db.query(query, [req.params.planId]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur récupération terrain" });
    }
});

app.post('/terrain', async (req, res) => {
    const { name, plans_id, type_equipements_id, zone, comment } = req.body;
    if (!name || !plans_id || !type_equipements_id) {
        return res.status(400).json({ error: "Champs obligatoires manquants." });
    }
    try {
        await db.query(
            `INSERT INTO equipements_terrain 
            (name, plans_id, type_equipements_id, zone, comment, x_axis, y_axis) 
            VALUES (?, ?, ?, ?, ?, 50, 50)`,
            [name, plans_id, type_equipements_id, zone, comment]
        );
        res.status(201).json({ message: "Équipement placé sur le plan." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur création." });
    }
});

app.put('/terrain/:id/position', async (req, res) => {
    const { x, y } = req.body;
    try {
        await db.query(
            'UPDATE equipements_terrain SET x_axis = ?, y_axis = ? WHERE id = ?',
            [x, y, req.params.id]
        );
        res.json({ message: "Position sauvegardée." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur déplacement." });
    }
});

app.delete('/terrain/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM equipements_terrain WHERE id = ?', [req.params.id]);
        res.json({ message: "Supprimé." });
    } catch (err) { res.status(500).json({ error: "Erreur suppression" }); }
});

// --- ROUTES POUR LES RONDES (ADMIN) ---

app.get('/users/operators', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, identifier, email FROM users WHERE role_id = 3');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: "Erreur récupération opérateurs" }); }
});

app.get('/terrain/all-details', async (req, res) => {
    try {
        const query = `
            SELECT t.id, t.name, t.zone, p.name as plan_name, type.symbol
            FROM equipements_terrain t
            JOIN plans p ON t.plans_id = p.id
            JOIN type_equipements type ON t.type_equipements_id = type.id
            ORDER BY p.name, t.zone
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: "Erreur récupération global terrain" }); }
});

app.post('/rondes', async (req, res) => {
    const { name, operator_id, creator_id, scheduled_date, equipments_ids } = req.body;
    if (!name || !operator_id || !scheduled_date) return res.status(400).json({ error: "Champs manquants" });

    try {
        await db.query(
            `INSERT INTO demande_rondes (name, operator_id, creator_id, scheduled_date, target_equipments_ids) 
             VALUES (?, ?, ?, ?, ?)`,
            [name, operator_id, creator_id, scheduled_date, JSON.stringify(equipments_ids)]
        );
        res.status(201).json({ message: "Ronde créée avec succès !" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur création ronde" });
    }
});

// --- ROUTES OPÉRATEUR (EXECUTION RONDES) ---

app.get('/rondes/assigned/:userId', async (req, res) => {
    try {
        const query = `
            SELECT r.*, u.identifier as creator_name
            FROM demande_rondes r
            JOIN users u ON r.creator_id = u.id
            WHERE r.operator_id = ? AND r.status != 'completed'
            ORDER BY r.scheduled_date ASC
        `;
        const [rows] = await db.query(query, [req.params.userId]);
        res.json(rows);
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: "Erreur récupération rondes" }); 
    }
});

app.get('/rondes/:id/details', async (req, res) => {
    try {
        const [ronde] = await db.query('SELECT target_equipments_ids FROM demande_rondes WHERE id = ?', [req.params.id]);
        
        if (ronde.length === 0) return res.status(404).json({ error: "Ronde introuvable" });
        
        let idsRaw = ronde[0].target_equipments_ids;
        let ids = [];

        // Parsing JSON sécurisé
        if (Array.isArray(idsRaw)) {
            ids = idsRaw;
        } else if (typeof idsRaw === 'string') {
            try {
                ids = JSON.parse(idsRaw);
            } catch (e) {
                console.error("Erreur parsing JSON IDs:", e);
                return res.status(500).json({ error: "Données corrompues" });
            }
        }
        
        if (!ids || ids.length === 0) return res.json([]);

        const query = `
            SELECT t.id, t.name, t.zone, type.symbol, type.equipement_val
            FROM equipements_terrain t
            JOIN type_equipements type ON t.type_equipements_id = type.id
            WHERE t.id IN (?)
            ORDER BY t.zone
        `;
        const [equipments] = await db.query(query, [ids]);
        res.json(equipments);
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: "Erreur détails ronde" }); 
    }
});

// 3. Soumettre le rapport de ronde ET mettre à jour les équipements
app.post('/rondes/:id/submit', async (req, res) => {
    const roundId = req.params.id;
    const { operator_id, report_data, etat } = req.body;

    try {
        // 1. Sauvegarder le rapport (Archive)
        await db.query(
            `INSERT INTO rapport_rondes (demande_ronde_id, operator_id, report_data, etat) 
             VALUES (?, ?, ?, ?)`,
            [roundId, operator_id, JSON.stringify(report_data), etat || 'valide']
        );

        // 2. Mettre à jour le statut de la ronde
        await db.query('UPDATE demande_rondes SET status = "completed" WHERE id = ?', [roundId]);

        // 3. MISE À JOUR DES ÉQUIPEMENTS
        for (const item of report_data) {
            const boolVal = item.status === '1' ? 1 : 0;
            const analogVal = item.value ? parseFloat(item.value) : null;
            const commentVal = item.comment || null;

            await db.query(
                'UPDATE equipements_terrain SET bool_value = ?, analog_value = ?, comment = ? WHERE id = ?',
                [boolVal, analogVal, commentVal, item.id]
            );
        }

        res.json({ message: "Rapport enregistré et équipements mis à jour." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur enregistrement rapport" });
    }
});

// --- ROUTES HISTORIQUE & MODIFICATION ---

// 1. Récupérer tout l'historique des rapports
app.get('/reports', async (req, res) => {
    try {
        const query = `
            SELECT 
                rr.id, rr.etat, rr.executed_at, rr.report_data,
                dr.name as round_name, dr.scheduled_date, dr.id as demande_id,
                u_op.identifier as operator_name, u_op.id as operator_id,
                u_creator.identifier as creator_name
            FROM rapport_rondes rr
            JOIN demande_rondes dr ON rr.demande_ronde_id = dr.id
            JOIN users u_op ON rr.operator_id = u_op.id
            JOIN users u_creator ON dr.creator_id = u_creator.id
            ORDER BY rr.executed_at DESC
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: "Erreur historique" }); }
});

// 2. Modifier un rapport (Obsolète -> Nouveau)
app.post('/reports/modify', async (req, res) => {
    const { old_report_id, demande_id, operator_id, new_report_data, modifier_id } = req.body;

    try {
        // A. Passer l'ancien rapport en 'obsolete'
        await db.query('UPDATE rapport_rondes SET etat = "obsolete" WHERE id = ?', [old_report_id]);

        // B. Créer le nouveau rapport en 'modifie'
        const [result] = await db.query(
            `INSERT INTO rapport_rondes (demande_ronde_id, operator_id, report_data, etat) 
             VALUES (?, ?, ?, "modifie")`,
            [demande_id, operator_id, JSON.stringify(new_report_data)]
        );

        // C. Mettre à jour les équipements sur le terrain
        for (const item of new_report_data) {
            const boolVal = item.status === '1' ? 1 : 0;
            const analogVal = item.value ? parseFloat(item.value) : null;
            const commentVal = item.comment || null;

            await db.query(
                'UPDATE equipements_terrain SET bool_value = ?, analog_value = ?, comment = ? WHERE id = ?',
                [boolVal, analogVal, commentVal, item.id]
            );
        }

        res.json({ message: "Rapport modifié avec succès." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur modification" });
    }
});

// --- ROUTES DASHBOARD (KPIs) --- [NOUVEAU]

// 1. KPI OPÉRATIONNELS
app.get('/dashboard/operational', async (req, res) => {
    try {
        const [alarms] = await db.query('SELECT COUNT(*) as count FROM equipements_terrain WHERE bool_value = 0');
        const [pending] = await db.query('SELECT COUNT(*) as count FROM demande_rondes WHERE status != "completed"');
        const [totalEquip] = await db.query('SELECT COUNT(*) as count FROM equipements_terrain');
        const [todayRounds] = await db.query('SELECT COUNT(*) as count FROM demande_rondes WHERE scheduled_date = CURRENT_DATE');

        // Calcul disponibilité
        const activeCount = totalEquip[0].count - alarms[0].count;
        const availability = totalEquip[0].count > 0 ? ((activeCount / totalEquip[0].count) * 100).toFixed(1) : 100;

        res.json({
            alarms: alarms[0].count,
            pending_rounds: pending[0].count,
            availability: availability,
            today_rounds: todayRounds[0].count,
            total_equipments: totalEquip[0].count
        });
    } catch (err) { res.status(500).json({ error: "Erreur KPI Ops" }); }
});

// 2. KPI MAINTENANCE
app.get('/dashboard/maintenance', async (req, res) => {
    try {
        // Top 5 Zones critiques
        const [topZones] = await db.query(`
            SELECT CONCAT(p.name, ' - ', t.zone) as label, COUNT(*) as count 
            FROM equipements_terrain t
            JOIN plans p ON t.plans_id = p.id
            WHERE t.bool_value = 0
            GROUP BY p.name, t.zone
            ORDER BY count DESC
            LIMIT 5
        `);

        // Répartition par Type
        const [defectsByType] = await db.query(`
            SELECT type.name as label, COUNT(*) as count
            FROM equipements_terrain t
            JOIN type_equipements type ON t.type_equipements_id = type.id
            WHERE t.bool_value = 0
            GROUP BY type.name
        `);

        res.json({ topZones, defectsByType });
    } catch (err) { res.status(500).json({ error: "Erreur KPI Maint" }); }
});

// 3. KPI PERFORMANCE (Admin +) - MODIFIÉ
app.get('/dashboard/performance', async (req, res) => {
    try {
        // A. Taux de réalisation (Excluant les obsolètes)
        // On compte le nombre de demandes qui ont au moins un rapport VALIDE ou MODIFIE (pas obsolete)
        const [validRounds] = await db.query(`
            SELECT COUNT(DISTINCT demande_ronde_id) as count 
            FROM rapport_rondes 
            WHERE etat != 'obsolete'
        `);
        
        const [totalRounds] = await db.query('SELECT COUNT(*) as count FROM demande_rondes');
        
        const completionRate = totalRounds[0].count > 0 
            ? ((validRounds[0].count / totalRounds[0].count) * 100).toFixed(1) 
            : 0;

        // B. Activité par Opérateur (Excluant les obsolètes)
        const [operatorActivity] = await db.query(`
            SELECT u.identifier as label, COUNT(*) as count
            FROM rapport_rondes r
            JOIN users u ON r.operator_id = u.id
            WHERE r.etat != 'obsolete'
            GROUP BY u.identifier
            ORDER BY count DESC
            LIMIT 5
        `);

        // C. Retard Moyen par Opérateur (NOUVEAU)
        // DATEDIFF renvoie le nombre de jours. Si négatif = en avance, positif = en retard.
        const [avgDelay] = await db.query(`
            SELECT 
                u.identifier as label, 
                CAST(AVG(DATEDIFF(r.executed_at, dr.scheduled_date)) AS DECIMAL(10,1)) as avg_days
            FROM rapport_rondes r
            JOIN demande_rondes dr ON r.demande_ronde_id = dr.id
            JOIN users u ON r.operator_id = u.id
            WHERE r.etat != 'obsolete'
            GROUP BY u.identifier
            ORDER BY avg_days DESC
        `);

        res.json({ 
            completionRate, 
            totalRounds: totalRounds[0].count, 
            operatorActivity,
            avgDelay // On renvoie la nouvelle donnée
        });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: "Erreur KPI Perf" }); 
    }
});

// --- ROUTE ALARMES (Équipements en défaut) ---
app.get('/alarms/active', async (req, res) => {
    try {
        const query = `
            SELECT 
                t.id, 
                t.name, 
                t.zone, 
                t.comment, 
                t.bool_value,
                p.name as plan_name,
                type.name as type_name,
                type.symbol
            FROM equipements_terrain t
            JOIN plans p ON t.plans_id = p.id
            JOIN type_equipements type ON t.type_equipements_id = type.id
            WHERE t.bool_value = 0
            ORDER BY p.name, t.zone
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur récupération alarmes" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});