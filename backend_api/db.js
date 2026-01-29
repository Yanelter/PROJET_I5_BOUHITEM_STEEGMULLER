const mysql = require('mysql2');
require('dotenv').config();

// Création d'un pool de connexions (plus performant qu'une connexion unique)
const pool = mysql.createPool({
    host: process.env.DB_HOST,      // Défini dans docker-compose
    user: process.env.DB_USER,      // Défini dans docker-compose
    password: process.env.DB_PASSWORD, // Défini dans docker-compose
    database: process.env.DB_NAME,  // Défini dans docker-compose
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// On exporte la version "promise" pour utiliser async/await (plus moderne)
module.exports = pool.promise();