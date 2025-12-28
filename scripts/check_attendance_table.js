const { pool, testConnection } = require('./config/db');

async function checkTables() {
    try {
        await testConnection();
        const [rows] = await pool.query("SHOW TABLES LIKE 'attendance'");
        console.log('Attendance table check:', rows);

        if (rows.length > 0) {
            const [cols] = await pool.query("DESCRIBE attendance");
            console.log('Attendance columns:', cols.map(c => c.Field));

            // Check data
            const [data] = await pool.query("SELECT * FROM attendance LIMIT 5");
            console.log('Attendance data sample:', data);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkTables();
