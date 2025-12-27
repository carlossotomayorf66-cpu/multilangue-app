const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Promisify for async/await usage
const promisePool = pool.promise();

const testConnection = async () => {
    try {
        const connection = await promisePool.getConnection();
        console.log('✅ Conexión a Base de Datos MySQL exitosa');
        connection.release();
    } catch (error) {
        console.error('❌ Error conectando a la Base de Datos:', error.code, error.message);
        if (error.code === 'ER_BAD_DB_ERROR') {
            console.log('⚠️ La base de datos no existe. Por favor ejecuta el script SQL de inicialización.');
        }
    }
};

module.exports = {
    pool: promisePool,
    testConnection
};
