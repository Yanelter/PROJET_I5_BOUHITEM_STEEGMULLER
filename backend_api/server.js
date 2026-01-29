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

// --- INSCRIPTION (Register) ---
app.post('/register', async (req, res) => {
    // On attend désormais 'identifier' aussi
    const { identifier, email, password } = req.body;

    if (!identifier || !email || !password) {
        return res.status(400).json({ error: "Identifiant, email et mot de passe requis" });
    }

    try {
        const hash = await bcrypt.hash(password, 10);

        // Insertion avec les nouveaux champs (role_type défaut 'user', theme défaut 'clair')
        const [result] = await db.query(
            'INSERT INTO users (identifier, email, password_hash, role_type, color_theme) VALUES (?, ?, ?, ?, ?)',
            [identifier, email, hash, 'user', 'clair']
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

// --- CONNEXION (Login) ---
app.post('/login', async (req, res) => {
    // On récupère 'login' (qui peut être email ou identifier) et 'password'
    const { login, password } = req.body;

    try {
        // SQL modifié : on cherche si 'email' = login OU si 'identifier' = login
        const [users] = await db.query(
            'SELECT * FROM users WHERE email = ? OR identifier = ?', 
            [login, login] // On passe la valeur deux fois pour remplir les deux "?"
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
                    theme: user.color_theme
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