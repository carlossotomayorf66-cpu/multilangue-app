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
        const userId = req.user.id;
        const isStudent = req.user.role === 'ESTUDIANTE';

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

        // Si es estudiante, obtener todas sus entregas para este curso
        let submissionsComp = [];
        if (isStudent) {
            const [subs] = await pool.query(`
                SELECT s.* 
                FROM submissions s
                JOIN activities a ON s.activity_id = a.id
                JOIN units u ON a.unit_id = u.id
                WHERE u.course_id = ? AND s.student_id = ?
            `, [id, userId]);
            submissionsComp = subs;
        }

        // Para cada unidad, obtener actividades y calcular progreso
        for (let unit of units) {
            const [activities] = await pool.query('SELECT * FROM activities WHERE unit_id = ?', [unit.id]);

            // Adjuntar submissions si es estudiante
            if (isStudent) {
                let totalPossible = 0;
                let totalEarned = 0;

                activities.forEach(act => {
                    const sub = submissionsComp.find(s => s.activity_id === act.id);
                    act.user_submission = sub || null; // Para el frontend

                    // Calcular progreso de la unidad
                    // Simplificación: Cada actividad cuenta igual o basada en notas
                    // Si es QUIZ, usamos nota. Si es otra, completado es 100%.

                    if (act.type === 'QUIZ') {
                        totalPossible += 100;
                        if (sub) {
                            if (sub.status === 'COMPLETED') {
                                totalEarned += 100; // Completed = 100% progress regardless of grade
                            } else if (sub.status === 'IN_PROGRESS' && sub.content) {
                                // Intento de cálculo parcial basado en respuestas guardadas vs preguntas totales
                                // Esto requiere parsing del content que es pesado aquí, 
                                // asignaremos un valor visual estimado o 0.
                                // Idealmente usamos el progress logic detallado, pero para la vista general:
                                try {
                                    const ans = JSON.parse(sub.content);
                                    // Necesitamos conteo preguntas. activity no trae preguntas aqui.
                                    // Asumimos 10% por estar empezado
                                    totalEarned += 10;
                                } catch (e) { }
                            }
                        }
                    } else {
                        // Tarea/Link
                        totalPossible += 100;
                        if (sub && sub.status === 'COMPLETED') totalEarned += 100;
                    }
                });

                // Calcular porcentaje de la UNIDAD
                unit.progress_percentage = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0;

                // Si preferimos 'completion rate' en vez de 'grade average':
                // unit.progress_percentage = (activities_completed / total_activities) * 100
                // El usuario pidió "0/100%" - usualmente significa completitud o nota promedio.
                // Dado el contexto educativo, nota promedio ponderada por actividad es mejor para barra de progreso real.
                // Pero para "cuánto te falta", completitud es mejor.
                // Usemos completitud ponderada por nota para quizzes:
                // Si saqué 50/100, tengo 50% de progreso en esa actividad.
            }

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

// === PROGRESO ===
exports.getCourseProgress = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user.id;
        const role = req.user.role;

        // 1. Obtener Unidades
        const [units] = await pool.query('SELECT id, title, order_index FROM units WHERE course_id = ? ORDER BY order_index', [id]);

        // 2. Obtener Actividades con recuento de preguntas
        const [activities] = await pool.query(`
            SELECT a.id, a.unit_id, a.title, a.max_score, a.type,
                   (SELECT COUNT(*) FROM activity_questions aq WHERE aq.activity_id = a.id) as question_count
            FROM activities a 
            JOIN units u ON a.unit_id = u.id 
            WHERE u.course_id = ?
        `, [id]);

        // 3. Determinar Estudiantes a consultar
        let students = [];
        if (role === 'ESTUDIANTE') {
            students = [{ id: currentUserId }];
        } else {
            const [roster] = await pool.query(`
                SELECT u.id, u.full_name, u.email 
                FROM users u
                JOIN enrollments e ON u.id = e.student_id
                WHERE e.course_id = ?
            `, [id]);
            students = roster;
        }

        if (students.length === 0) {
            return res.json({ success: true, data: [] });
        }

        const studentIds = students.map(s => s.id);

        // 4. Obtener Entregas (Submissions)
        let submissions = [];
        if (studentIds.length > 0 && activities.length > 0) {
            const [subs] = await pool.query(`
                SELECT s.student_id, s.activity_id, s.grade, s.submitted_at, s.feedback, s.status, s.content
                FROM submissions s
                WHERE s.student_id IN (${studentIds.join(',')})
                AND s.activity_id IN (${activities.map(a => a.id).join(',')})
            `);
            submissions = subs;
        }

        // 5. Procesar Datos
        const result = students.map(student => {
            const studentSubs = submissions.filter(s => s.student_id === student.id);

            const unitsProgress = units.map(unit => {
                const unitActivities = activities.filter(a => a.unit_id === unit.id);

                if (unitActivities.length === 0) {
                    return {
                        unit_id: unit.id,
                        unit_title: unit.title,
                        percentage: 0,
                        status: 'gray',
                        details: []
                    };
                }

                let totalProgress = 0; // Sum of percentages (completed or partial)

                const details = unitActivities.map(act => {
                    const sub = studentSubs.find(s => s.activity_id === act.id);
                    let itemProgress = 0;
                    let displayGrade = null;
                    let status = 'PENDING';

                    if (sub) {
                        status = sub.status || 'COMPLETED'; // migrating old nulls to completed assumption

                        if (status === 'COMPLETED') {
                            displayGrade = sub.grade || 0;
                            itemProgress = 100; // Completed = 100% progress
                        } else if (status === 'IN_PROGRESS' && act.type === 'QUIZ') {
                            // Calculate partial
                            try {
                                const answers = JSON.parse(sub.content || '{}');
                                const answeredCount = Object.keys(answers).length;
                                const totalQ = act.question_count || 1;
                                itemProgress = (answeredCount / totalQ) * 100;
                            } catch (e) { itemProgress = 0; }
                        }
                    }

                    totalProgress += itemProgress;

                    return {
                        activity_id: act.id, // Added ID
                        activity_title: act.title,
                        type: act.type,
                        grade: displayGrade,
                        progress_percentage: itemProgress,
                        status: status,
                        submitted_at: sub ? sub.submitted_at : null,
                        feedback: sub ? sub.feedback : null
                    };
                });

                // Calcular promedio basado en progreso (esfuerzo realizado)
                const percentage = Math.round(totalProgress / unitActivities.length);

                let colorStatus = 'gray';
                if (percentage > 0 && percentage <= 30) colorStatus = 'red';
                else if (percentage > 30 && percentage <= 99) colorStatus = 'yellow';
                else if (percentage >= 100) colorStatus = 'green';

                return {
                    unit_id: unit.id,
                    unit_title: unit.title,
                    percentage,
                    status: colorStatus,
                    details
                };
            });

            return {
                student_id: student.id,
                full_name: student.full_name,
                email: student.email,
                units: unitsProgress
            };
        });

        res.json({ success: true, data: result });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
