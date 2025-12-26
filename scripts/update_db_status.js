const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '',
            database: process.env.DB_NAME || 'multilangue'
        });

        // Add status column
        // We use try-catch specifically for the query in case column exists
        try {
            await pool.query("ALTER TABLE users ADD COLUMN status ENUM('ACTIVE', 'PENDING') DEFAULT 'ACTIVE'");
            console.log("✅ Column 'status' added successfully.");
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log("ℹ️ Column 'status' already exists.");
            } else {
                throw err;
            }
        }
        process.exit(0);
    } catch (e) {
        console.error("❌ Error:", e.message);
        process.exit(1);
    }
})();
