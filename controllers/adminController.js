const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

// === GESTIÓN DE USUARIOS ===
exports.getAllUsers = async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, full_name, email, phone, dni, age, role, created_at FROM users ORDER BY created_at DESC');
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createUser = async (req, res) => {
    const connection = await pool.getConnection(); // Use transaction for multi-step
    try {
        await connection.beginTransaction();

        const { full_name, email, role, phone, dni, course_id } = req.body;

        // Validation
        if (!full_name || !email || !dni) {
            throw new Error('Nombre, Email y Cédula son obligatorios');
        }

        const [exists] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
        if (exists.length > 0) throw new Error('El email ya existe');

        // Password is DNI by default
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(dni, salt);

        const [result] = await connection.query(
            'INSERT INTO users (full_name, email, password, role, phone, dni, must_change_password, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [full_name, email, hash, role, phone, dni, true, 'ACTIVE']
        );
        const userId = result.insertId;

        // If course_id is provided and it's a student, enroll them
        if (role === 'ESTUDIANTE' && course_id) {
            await connection.query('INSERT INTO enrollments (course_id, student_id) VALUES (?, ?)', [course_id, userId]);
        }

        await connection.commit();
        res.status(201).json({ success: true, message: 'Usuario creado correctamente. Contraseña inicial: DNI' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};

exports.updateUser = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const { full_name, email, role, phone, dni, age, course_id } = req.body;

        await connection.query(
            'UPDATE users SET full_name = ?, email = ?, role = ?, phone = ?, dni = ?, age = ? WHERE id = ?',
            [full_name, email, role, phone, dni, age || null, id]
        );

        // Assign to course if provided
        if (role === 'ESTUDIANTE' && course_id) {
            // Check if already enrolled
            const [existing] = await connection.query('SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?', [id, course_id]);
            if (existing.length === 0) {
                await connection.query('INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)', [id, course_id]);
            }
        }

        await connection.commit();
        res.json({ success: true, message: 'Usuario actualizado' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};

exports.deleteUser = async (req, res) => {
    try {
        await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Usuario eliminado' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getPendingUsers = async (req, res) => {
    try {
        const [users] = await pool.query("SELECT id, full_name, email, phone, dni, age, created_at FROM users WHERE status = 'PENDING' ORDER BY created_at ASC");
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.approveUser = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("UPDATE users SET status = 'ACTIVE' WHERE id = ?", [id]);
        res.json({ success: true, message: 'Usuario aprobado exitosamente.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch user to get DNI
        const [users] = await pool.query('SELECT dni FROM users WHERE id = ?', [id]);
        if (users.length === 0) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

        const dni = users[0].dni;
        if (!dni) return res.status(400).json({ success: false, message: 'Este usuario no tiene DNI registrado' });

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(dni, salt);

        await pool.query('UPDATE users SET password = ?, must_change_password = TRUE WHERE id = ?', [hash, id]);

        res.json({ success: true, message: 'Contraseña reseteada a Cédula/DNI' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// === GESTIÓN DE CURSOS ===
exports.createCourse = async (req, res) => {
    try {
        const { name, language_id, teacher_id, schedule_description, start_date, end_date } = req.body;
        const [result] = await pool.query(
            'INSERT INTO courses (name, language_id, teacher_id, schedule_description, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)',
            [name, language_id, teacher_id, schedule_description, start_date, end_date]
        );
        res.status(201).json({ success: true, courseId: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getLanguages = async (req, res) => {
    const [langs] = await pool.query('SELECT * FROM languages');
    res.json({ success: true, data: langs });
};

exports.getAllCourses = async (req, res) => {
    try {
        const [courses] = await pool.query(`
            SELECT c.*, l.name as language, u.full_name as teacher, COUNT(e.id) as student_count 
            FROM courses c 
            JOIN languages l ON c.language_id = l.id
            JOIN users u ON c.teacher_id = u.id
            LEFT JOIN enrollments e ON c.id = e.course_id
            GROUP BY c.id
            ORDER BY c.created_at DESC
        `);
        res.json({ success: true, data: courses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
