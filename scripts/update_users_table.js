const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateSchema() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME
        });

        console.log('Connected to database.');

        try {
            await connection.query("ALTER TABLE users ADD COLUMN must_change_password BOOLEAN DEFAULT FALSE");
            console.log("Column 'must_change_password' added successfully.");
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log("Column 'must_change_password' already exists.");
            } else {
                throw err;
            }
        }

        await connection.end();
    } catch (error) {
        console.error('Error updating schema:', error);
    }
}

updateSchema();
