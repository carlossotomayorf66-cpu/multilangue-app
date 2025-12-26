const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDB() {
    console.log('🔄 Iniciando configuración de base de datos...');

    // Conexión sin seleccionar DB para poder crearla
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
    await connection.query(`USE \`${process.env.DB_NAME}\``);

    try {
        const sqlParams = fs.readFileSync(path.join(__dirname, '../database.sql'), 'utf8');

        // Separar comandos por ; para ejecutarlos uno a uno
        const statements = sqlParams.split(';').filter(stmt => stmt.trim());

        for (let statement of statements) {
            if (statement.trim()) {
                await connection.query(statement);
            }
        }

        console.log('✅ Base de datos y tablas creadas exitosamente.');
    } catch (error) {
        console.error('❌ Error al inicializar DB:', error);
    } finally {
        await connection.end();
    }
}

initDB();
