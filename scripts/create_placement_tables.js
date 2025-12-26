const db = require('../config/db');

const createTables = async () => {
    try {
        console.log('⏳ Creando tablas para Pruebas de Ubicación...');

        // 1. Placement Tests Table
        await db.pool.query(`
            CREATE TABLE IF NOT EXISTS placement_tests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                language VARCHAR(50) NOT NULL,
                title VARCHAR(100) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. Questions Table
        await db.pool.query(`
            CREATE TABLE IF NOT EXISTS placement_questions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                test_id INT NOT NULL,
                question_text TEXT NOT NULL,
                FOREIGN KEY (test_id) REFERENCES placement_tests(id) ON DELETE CASCADE
            )
        `);

        // 3. Options Table
        await db.pool.query(`
            CREATE TABLE IF NOT EXISTS placement_options (
                id INT AUTO_INCREMENT PRIMARY KEY,
                question_id INT NOT NULL,
                option_text VARCHAR(255) NOT NULL,
                is_correct BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (question_id) REFERENCES placement_questions(id) ON DELETE CASCADE
            )
        `);

        // 4. Results Table
        await db.pool.query(`
            CREATE TABLE IF NOT EXISTS placement_results (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                test_id INT NOT NULL,
                score DECIMAL(5,2) NOT NULL,
                taken_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (test_id) REFERENCES placement_tests(id) ON DELETE CASCADE
            )
        `);

        console.log('✅ Tablas de Pruebas de Ubicación creadas correctamente.');
        process.exit();
    } catch (error) {
        console.error('❌ Error creando tablas:', error);
        process.exit(1);
    }
};

createTables();
