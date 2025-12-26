const { pool } = require('./config/db');

(async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS materials (
                id INT AUTO_INCREMENT PRIMARY KEY,
                course_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                url VARCHAR(255) NOT NULL,
                file_type VARCHAR(50),
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
            )
        `);
        console.log('Table materials created successfully');
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();
