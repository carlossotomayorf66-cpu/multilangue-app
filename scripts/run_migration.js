const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });

    try {
        const sql = fs.readFileSync(path.join(__dirname, 'migration_add_fields.sql'), 'utf8');
        const statements = sql.split(';').filter(s => s.trim());

        for (let stmt of statements) {
            try {
                await connection.query(stmt);
                console.log('Statement executed');
            } catch (e) {
                // Ignore duplicate column errors
                if (e.code !== 'ER_DUP_FIELDNAME') console.error(e.message);
            }
        }
        console.log('✅ Migración completada');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

runMigration();
