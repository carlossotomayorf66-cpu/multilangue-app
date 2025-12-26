const { pool } = require('../config/db');

class User {
    static async create(userData) {
        const { full_name, email, password, role, status, phone, dni, age } = userData;

        let query = `
            INSERT INTO users (full_name, email, password, role, status, phone, dni, age) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        let params = [full_name, email, password, role || 'ESTUDIANTE', status || 'PENDING', phone || null, dni || null, age || null];

        const [result] = await pool.execute(query, params);
        return result.insertId;
    }

    static async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = ?';
        const [rows] = await pool.execute(query, [email]);
        return rows[0];
    }

    static async findById(id) {
        const query = 'SELECT id, full_name, email, role, phone, dni, age, status, created_at FROM users WHERE id = ?';
        const [rows] = await pool.execute(query, [id]);
        return rows[0];
    }

    static async findPending() {
        const query = "SELECT id, full_name, email, role, created_at FROM users WHERE status = 'PENDING'";
        const [rows] = await pool.execute(query);
        return rows;
    }

    static async updateStatus(id, status) {
        const query = 'UPDATE users SET status = ? WHERE id = ?';
        await pool.execute(query, [status, id]);
    }

    static async updatePassword(id, hashedPassword) {
        const query = 'UPDATE users SET password = ?, must_change_password = FALSE WHERE id = ?';
        await pool.execute(query, [hashedPassword, id]);
    }
}

module.exports = User;
