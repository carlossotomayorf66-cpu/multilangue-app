const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME
        });

        console.log('Connected to database.');

        // 1. Create activity_questions
        await connection.query(`
            CREATE TABLE IF NOT EXISTS activity_questions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                activity_id INT NOT NULL,
                question_text TEXT NOT NULL,
                FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
            )
        `);
        console.log('Table activity_questions created/verified.');

        // 2. Create activity_options
        await connection.query(`
            CREATE TABLE IF NOT EXISTS activity_options (
                id INT AUTO_INCREMENT PRIMARY KEY,
                question_id INT NOT NULL,
                option_text VARCHAR(255) NOT NULL,
                is_correct BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (question_id) REFERENCES activity_questions(id) ON DELETE CASCADE
            )
        `);
        console.log('Table activity_options created/verified.');

        await connection.end();
        console.log('Database updated successfully.');

    } catch (error) {
        console.error('Error updating database:', error);
    }
})();
