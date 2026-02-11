# 🏥 HealthCheck360

**HealthCheck360** est une solution complète de gestion de maintenance, de surveillance d'équipements et de suivi de rondes techniques. Elle permet aux administrateurs de configurer des zones et des équipements sur des plans interactifs, et aux opérateurs de réaliser des contrôles sur le terrain via une interface dédiée.

---

## 📑 Table des Matières

* ✨ Fonctionnalités Clés
* 🛠️ Stack Technique
* 🚀 Installation et Démarrage
* ⚙️ Configuration
* 📖 Guide d'Utilisation
* 📂 Structure du Projet
* 🔒 [Gestion des Rôles](https://github.com/Yanelter/PROJET_I5_BOUHITEM_STEEGMULLER/new/main?filename=README.md#-fonctionnalit%C3%A9s-cl%C3%A9s)

---

## ✨ Fonctionnalités Clés

### 📊 Dashboard de Pilotage

* **KPIs Opérationnels :** Suivi en temps réel des alarmes, taux de disponibilité et rondes en attente.
* **Analyse Maintenance :** Identification des "Top Zones Critiques" et répartition des pannes par type d'équipement.
* **Performance d'Équipe :** Suivi du taux de réalisation et du retard moyen par opérateur.
* **Visualisation :** Graphiques interactifs (Chart.js) et jauges de performance.

### 🗺️ Zooning & Équipements

* **Plans Interactifs :** Upload de plans (images) et placement des équipements par Drag & Drop.
* **Configuration :** Gestion des types d'équipements (Binaire OK/NOK ou Analogique avec valeurs).
* **Géolocalisation interne :** Positionnement X/Y précis sur les plans.

### 🔄 Gestion des Rondes

* **Planification :** Création de rondes par les administrateurs avec sélection des équipements ciblés.
* **Exécution Mobile :** Interface simplifiée pour les opérateurs (Checklist, relevé de valeurs, commentaires).
* **Historique & Correction :** Traçabilité complète des rapports. Possibilité de corriger un rapport (versioning avec statut `obsolete` vs `modifie`).

### 🚨 Gestion des Alarmes

* Remontée immédiate des équipements en défaut (`bool_value = 0`).
* Vue centralisée des urgences.

---

## 🛠️ Stack Technique

Le projet repose sur une architecture conteneurisée via **Docker**.

### **Frontend**

* **Framework :** React 18 (Vite)
* **Langage :** JavaScript (ES6+)
* **Style :** CSS3 (Variables CSS pour thèmes), Flexbox/Grid
* **Visualisation :** Chart.js, React-Chartjs-2
* **Icônes :** Lucide React

### **Backend**

* **Serveur :** Node.js / Express
* **Sécurité :** Bcrypt (Hashage mots de passe)
* **Uploads :** Multer (Gestion des fichiers plans)
* **API :** RESTful architecture

### **Base de Données**

* **SGBD :** MariaDB (Compatible MySQL)
* **Connecteur :** MySQL2 (Promise wrapper)

---

## 🚀 Installation et Démarrage

### Prérequis

* [Docker](https://www.google.com/search?q=https://www.docker.com/) et Docker Compose installés sur votre machine.
* [Git](https://www.google.com/search?q=https://git-scm.com/) pour cloner le dépôt.

### 1. Cloner le projet

```bash
git clone https://github.com/VOTRE_USERNAME/HealthCheck360.git
cd HealthCheck360

```

### 2. Configuration du `.gitignore`

Assurez-vous que les dossiers sensibles et lourds sont ignorés :

```text
node_modules/
.env
uploads_data/
.DS_Store

```

### 3. Lancement via Docker

L'application est configurée pour se lancer en une seule commande. Cela construira le Frontend, le Backend et la Base de données.

```bash
docker-compose up --build

```

Une fois lancé :

* **Frontend :** Accessible sur `http://localhost:3000`
* **Backend :** Accessible sur `http://localhost:5000`
* **Base de données :** Port `3306`

> **Note :** Si vous rencontrez des erreurs de cache Docker, utilisez :
> `docker builder prune --all --force` puis `docker-compose build --no-cache`.

---

## ⚙️ Configuration

### Variables d'Environnement

Créez un fichier `.env` à la racine (ou dans les dossiers respectifs si nécessaire) pour configurer la base de données :

```env
DB_HOST=health_check_360_db
DB_USER=user
DB_PASSWORD=userpassword
DB_NAME=health_check_360
JWT_SECRET=votre_secret_tres_securise

```

---

## 📖 Guide d'Utilisation

### 1. Première Connexion

Un compte **Super Admin** doit être créé directement en base de données ou via la route d'inscription initiale pour configurer les premiers utilisateurs.

### 2. Workflow Typique

1. **Admin :** Upload un plan dans "Configurer Zone".
2. **Admin :** Crée des types d'équipements (ex: Extincteur, Manomètre).
3. **Admin :** Place des équipements sur le plan.
4. **Admin :** Crée une "Ronde" assignée à un Opérateur.
5. **Opérateur :** Se connecte, voit sa ronde dans "Lancer une ronde".
6. **Opérateur :** Exécute la ronde (remplit les statuts et valeurs).
7. **Admin/Opérateur :** Consulte les résultats dans "Historique Rapports" ou via le "Dashboard".

---

## 📂 Structure du Projet

```bash
HealthCheck360/
├── backend_api/            # API Node.js/Express
│   ├── uploads/            # Stockage des images (Plans)
│   ├── server.js           # Point d'entrée serveur & Routes
│   ├── db.js               # Connexion BDD
│   └── Dockerfile
├── frontend_app/           # Application React
│   ├── src/
│   │   ├── components/     # Composants réutilisables (Sidebar, Zooning...)
│   │   ├── pages/          # Pages principales (Dashboard, Alarms, Rounds...)
│   │   └── App.jsx         # Routing
│   └── Dockerfile
├── docker-compose.yml      # Orchestration des conteneurs
└── README.md

```

---

## 🔒 Gestion des Rôles

L'application gère des permissions granulaires basées sur `role_id` :

| Rôle | ID | Permissions | Accès |
| --- | --- | --- | --- |
| **Invité** | 2 | Lecture seule | Dashboard (Ops), Profil |
| **Opérateur** | 3 | Exécution Rondes | Dashboard (Ops, Maint), Rondes, Historique |
| **Admin** | 4 | Config, Écriture | Tout sauf gestion utilisateurs avancée |
| **Super Admin** | 5 | Accès Total | Gestion Utilisateurs, Modification Rôles |

---

## 🤝 Contribution

Les contributions sont les bienvenues !

1. Forkez le projet.
2. Créez votre branche de fonctionnalité (`git checkout -b feature/AmazingFeature`).
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`).
4. Push sur la branche (`git push origin feature/AmazingFeature`).
5. Ouvrez une Pull Request.

---

*Développé avec ❤️ pour l'industrie 4.0*
