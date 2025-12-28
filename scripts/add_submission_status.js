const { pool } = require('../config/db');

async function migrate() {
    try {
        console.log('Adding status column to submissions...');

        // Add status column if not exists
        // We use a try-catch on the altering because "IF NOT EXISTS" syntax depends on MySQL version for ALTER TABLE
        try {
            await pool.query("ALTER TABLE submissions ADD COLUMN status ENUM('IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'COMPLETED'");
            console.log("Column 'status' added.");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log("Column 'status' already exists.");
            } else {
                throw e;
            }
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

migrate();
