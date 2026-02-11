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
* 🔒 Gestion des Rôles

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

* Remontée immédiate des équipements en défaut.
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
dist/
build/
.env
mariadb_data/
.DS_Store
uploads_data/

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
DB_HOST=votre_bdd_vsc
DB_USER=votre_id
DB_PASSWORD=votre_mdp
DB_NAME=votre_bdd
JWT_SECRET=votre_secret_tres_securise

```

---

## 📖 Guide d'Utilisation

### 1. Première Connexion

Un compte **Super Admin** doit être créé directement en base de données ou via la route d'inscription initiale pour configurer les premiers utilisateurs. Si le compte **Super Admin** ne se crée pas, il suffit de modifier le rôle du premier utilisateur créé directement dans la BDD.

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
│   ├── server.js           # Point d'entrée serveur & Routes
│   ├── db.js               # Connexion BDD
│   ├── package.json
│   ├── package-lock.json
│   ├── Dockerfile
│   └── .dockerignore
├── frontend_app/           # Application React
│   ├── src/
│   │   ├── components/     # Composants réutilisables (Sidebar, Zooning...)
│   │   ├── pages/          # Pages principales (Dashboard, Alarms, Rounds...)
│   │   ├── main.jsx
│   │   └── App.jsx         # Routing
│   ├── Dockerfile
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
├── mariadb_init/           # Base de données
│   └── init.sql            # Initialisation de la BDD au lancement
├── uploads_data/
│   └── plans/              # Stockage des images (Plans)
├── docker-compose.yml      # Orchestration des conteneurs
├── .gitignore
└── README.md

```

---

## 🔒 Gestion des Rôles

L'application gère des permissions granulaires basées sur `role_id` :

| Rôle | ID | Permissions | Accès |
| --- | --- | --- | --- |
| **Lecteur** | 1 | Lecture seule | Dashboard (Ops), Profil |
| **Lecteur Avancé** | 2 | Lecture & Export | Dashboard (Ops), Profil |
| **Opérateur** | 3 | Exécution Rondes | Dashboard (Ops, Maint), Rondes, Historique |
| **Admin** | 4 | Config, Écriture | Tout sauf gestion utilisateurs avancée |
| **Super Admin** | 5 | Accès Total | Gestion Utilisateurs, Modification Rôles |

---

*Développé avec ❤️ par Yanel Bouhitem et Manon Steegmuller dans le cadre du projet de 5e année du cursus PAUC au sein de l'école ingénieure UniLaSalle Amiens.*
