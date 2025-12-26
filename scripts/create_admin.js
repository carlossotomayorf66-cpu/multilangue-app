const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createAdmin() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });

    const email = 'multilangue28@gmail.com';
    const password = '060225';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    try {
        await connection.execute(
            'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE password = ?, role = ?',
            ['Administrador Principal', email, hash, 'ADMIN', hash, 'ADMIN']
        );
        console.log('✅ Usuario ADMIN creado/actualizado correctamente.');
        console.log('📧 Email: ' + email);
        console.log('🔑 Pass: ' + password);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

createAdmin();
