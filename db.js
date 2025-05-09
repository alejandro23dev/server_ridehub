const mysql = require('mysql2/promise'); // Usamos la versión Promise
require('dotenv').config();

const pool = mysql.createPool({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: 'railway',             // Base de datos al final de la URL
	port: 21132,                    // Puerto especificado en la URL
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
	ssl: { rejectUnauthorized: false } // Obligatorio para Railway
});

module.exports = pool;