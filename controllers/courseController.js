const { pool } = require('../config/db');

// Listar Cursos (se puede filtrar por rol en el frontend o aquí)
exports.getMyCourses = async (req, res) => {
    try {
        const userId = req.user.id;
        let query = '';

        if (req.user.role === 'ESTUDIANTE') {
            query = `
                SELECT c.*, l.name as language_name, u.full_name as teacher_name 
                FROM courses c
                JOIN enrollments e ON c.id = e.course_id
                JOIN languages l ON c.language_id = l.id
                JOIN users u ON c.teacher_id = u.id
                WHERE e.student_id = ?
            `;
        } else if (req.user.role === 'PROFESOR') {
            query = `
                SELECT c.*, l.name as language_name
                FROM courses c
                JOIN languages l ON c.language_id = l.id
                WHERE c.teacher_id = ?
            `;
        } else {
            // Admin ve todo
            query = `
                SELECT c.*, l.name as language_name, u.full_name as teacher_name 
                FROM courses c
                JOIN languages l ON c.language_id = l.id
                JOIN users u ON c.teacher_id = u.id
            `;
            return res.json({ success: true, data: (await pool.query(query))[0] });
        }

        const [courses] = await pool.query(query, [userId]);
        res.json({ success: true, data: courses });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.enrollStudent = async (req, res) => {
    try {
        const { student_id, course_id } = req.body;
        await pool.query('INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)', [student_id, course_id]);
        res.json({ success: true, message: 'Estudiante matriculado' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getCourseDetails = async (req, res) => {
    try {
        const { id } = req.params;
        // Obtener curso con detalles
        const [course] = await pool.query(`
            SELECT c.*, l.name as language_name, u.full_name as teacher_name 
            FROM courses c
            LEFT JOIN languages l ON c.language_id = l.id
            LEFT JOIN users u ON c.teacher_id = u.id
            WHERE c.id = ?
        `, [id]);

        if (!course.length) return res.status(404).json({ message: 'Curso no encontrado' });

        // Obtener unidades
        const [units] = await pool.query('SELECT * FROM units WHERE course_id = ? ORDER BY order_index', [id]);

        // Para cada unidad, obtener actividades
        for (let unit of units) {
            const [activities] = await pool.query('SELECT * FROM activities WHERE unit_id = ?', [unit.id]);
            unit.activities = activities;
        }

        res.json({ success: true, data: { course: course[0], units } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// === NUEVAS FUNCIONALIDADES (REALES) ===

exports.getCourseStudents = async (req, res) => {
    try {
        const { id } = req.params;
        const [students] = await pool.query(`
            SELECT u.id, u.full_name, u.email, u.dni 
            FROM users u
            JOIN enrollments e ON u.id = e.student_id
            WHERE e.course_id = ?
        `, [id]);
        res.json({ success: true, data: students });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const { date } = req.query; // YYYY-MM-DD
        if (!date) return res.status(400).json({ message: 'Fecha requerida' });

        const [attendance] = await pool.query(`
            SELECT a.*, u.full_name 
            FROM attendance a
            JOIN users u ON a.student_id = u.id
            WHERE a.course_id = ? AND a.date = ?
        `, [id, date]);

        res.json({ success: true, data: attendance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.markAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const { date, attendanceData } = req.body; // attendanceData: [{ student_id, status }]

        if (!date || !attendanceData) return res.status(400).json({ message: 'Datos incompletos' });

        // Upsert attendance
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            for (let item of attendanceData) {
                // Check if exists
                const [exists] = await connection.query(
                    'SELECT id FROM attendance WHERE course_id = ? AND student_id = ? AND date = ?',
                    [id, item.student_id, date]
                );

                if (exists.length > 0) {
                    await connection.query(
                        'UPDATE attendance SET status = ? WHERE id = ?',
                        [item.status, exists[0].id]
                    );
                } else {
                    await connection.query(
                        'INSERT INTO attendance (course_id, student_id, date, status) VALUES (?, ?, ?, ?)',
                        [id, item.student_id, date, item.status]
                    );
                }
            }
            await connection.commit();
            res.json({ success: true, message: 'Asistencia guardada' });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getRecordings = async (req, res) => {
    try {
        const { id } = req.params;
        const [recs] = await pool.query('SELECT * FROM recordings WHERE course_id = ? ORDER BY recorded_at DESC', [id]);
        res.json({ success: true, data: recs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.uploadRecording = async (req, res) => {
    try {
        console.log("Upload Request Body:", req.body);
        console.log("Upload Request File:", req.file);

        if (!req.file) return res.status(400).json({ message: 'No se subió ningún archivo' });

        const { id } = req.params;
        const filename = req.file.filename;
        const url = `/uploads/recordings/${filename}`; // Servir estáticamente

        console.log("Saving recording for Course:", id, "File:", filename);

        await pool.query('INSERT INTO recordings (course_id, filename, url) VALUES (?, ?, ?)', [id, filename, url]);

        res.json({ success: true, message: 'Grabación guardada', url });
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// === MATERIALES ===
exports.getMaterials = async (req, res) => {
    try {
        const { id } = req.params;
        const [materials] = await pool.query('SELECT * FROM materials WHERE course_id = ? ORDER BY uploaded_at DESC', [id]);
        res.json({ success: true, data: materials });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.uploadMaterial = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No se subió ningún archivo' });

        const { id } = req.params;
        const { title } = req.body;
        const filename = req.file.filename;
        const url = `/uploads/materials/${filename}`;
        const type = req.file.mimetype; // o extensión

        await pool.query('INSERT INTO materials (course_id, title, url, file_type) VALUES (?, ?, ?, ?)',
            [id, title || filename, url, type]);

        res.json({ success: true, message: 'Material subido correctamente' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// === HISTORIAL ASISTENCIA ===
exports.getAttendanceDates = async (req, res) => {
    try {
        const { id } = req.params;
        // Obtener fechas únicas con conteo de asistencia
        const [dates] = await pool.query(`
            SELECT date, COUNT(*) as record_count 
            FROM attendance 
            WHERE course_id = ? 
            GROUP BY date 
            ORDER BY date DESC
        `, [id]);

        // Formatear fechas para asegurar YYYY-MM-DD
        const formattedDates = dates.map(d => ({
            ...d,
            date: new Date(d.date).toISOString().split('T')[0]
        }));

        res.json({ success: true, data: formattedDates });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
