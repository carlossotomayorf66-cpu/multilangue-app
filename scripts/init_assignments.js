const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'crossover.proxy.rlwy.net',
    port: 59239,
    user: 'root',
    password: process.env.DB_PASSWORD || 'hQOvkNqYqCtXwVvXhNlVlIIDUdxbSlvC',
    database: 'railway'
};

/*
    Homework System Schema:
    1. assignments: Created by Professors/Admins for a course.
    2. assignment_submissions: Created by Students for an assignment.
*/

async function migrate() {
    let connection;
    try {
        console.log('Connecting to database...');
        try {
            connection = await mysql.createConnection(dbConfig);
        } catch (e) {
            console.log('Connection failed, trying multilangue DB name...');
            dbConfig.database = 'multilangue';
            connection = await mysql.createConnection(dbConfig);
        }
        console.log('Connected.');

        // 1. Table: Assignments
        console.log('Creating assignments table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS assignments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                course_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                due_date DATETIME,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
            )
        `);

        // 2. Table: Assignment Submissions
        console.log('Creating assignment_submissions table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS assignment_submissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                assignment_id INT NOT NULL,
                student_id INT NOT NULL,
                file_url VARCHAR(500),
                file_type VARCHAR(50),
                feedback TEXT,
                grade DECIMAL(5,2),
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        console.log('Migration completed successfully.');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
