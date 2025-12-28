const { pool } = require('../config/db');

// === ASSIGNMENTS (PROFESSOR) ===

exports.createAssignment = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { title, description, due_date } = req.body;

        if (!title) return res.status(400).json({ message: 'Título requerido' });

        await pool.query(
            'INSERT INTO assignments (course_id, title, description, due_date) VALUES (?, ?, ?, ?)',
            [courseId, title, description, due_date || null]
        );

        res.status(201).json({ success: true, message: 'Deber asignado correctamente' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteAssignment = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        await pool.query('DELETE FROM assignments WHERE id = ?', [assignmentId]);
        res.json({ success: true, message: 'Asignación eliminada' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getCourseAssignments = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;
        const role = req.user.role;

        // 1. Get Assignments
        const [assignments] = await pool.query(
            'SELECT * FROM assignments WHERE course_id = ? ORDER BY created_at DESC',
            [courseId]
        );

        // 2. If student, attach their submission status
        if (role === 'ESTUDIANTE') {
            const [submissions] = await pool.query(
                `SELECT * FROM assignment_submissions 
                 WHERE student_id = ? 
                 AND assignment_id IN (SELECT id FROM assignments WHERE course_id = ?)`,
                [userId, courseId]
            );

            assignments.forEach(a => {
                const sub = submissions.find(s => s.assignment_id === a.id);
                a.submission = sub || null;
            });
        }

        res.json({ success: true, data: assignments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// === SUBMISSIONS (STUDENT) ===

exports.submitAssignment = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'Archivo requerido' });

        const { assignmentId } = req.params;
        const studentId = req.user.id;
        const filename = req.file.filename;
        const url = `/uploads/assignments/${filename}`;
        const type = req.file.mimetype;

        // Check if already submitted? Upsert? 
        // Let's allow simple insert for now, or update if exists.
        const [existing] = await pool.query(
            'SELECT id FROM assignment_submissions WHERE assignment_id = ? AND student_id = ?',
            [assignmentId, studentId]
        );

        if (existing.length > 0) {
            await pool.query(
                'UPDATE assignment_submissions SET file_url = ?, file_type = ?, submitted_at = NOW() WHERE id = ?',
                [url, type, existing[0].id]
            );
        } else {
            await pool.query(
                'INSERT INTO assignment_submissions (assignment_id, student_id, file_url, file_type) VALUES (?, ?, ?, ?)',
                [assignmentId, studentId, url, type]
            );
        }

        res.json({ success: true, message: 'Deber enviado correctamente' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// === ADMIN/PROF VIEW ===

exports.getStudentSubmissions = async (req, res) => {
    // This is for the "View Student Homework" button in Admin/Prof panel
    try {
        const { courseId, studentId } = req.params;

        // Get all assignments for course
        const [assignments] = await pool.query(
            'SELECT * FROM assignments WHERE course_id = ? ORDER BY created_at DESC',
            [courseId]
        );

        if (assignments.length === 0) return res.json({ success: true, data: [] });

        // Get submissions for this student
        const [submissions] = await pool.query(
            `SELECT * FROM assignment_submissions 
             WHERE student_id = ? 
             AND assignment_id IN (${assignments.map(a => a.id).join(',')})`,
            [studentId]
        );

        // Merge
        const result = assignments.map(a => {
            const sub = submissions.find(s => s.assignment_id === a.id);
            return {
                assignment: a,
                submission: sub || null
            };
        });

        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAssignmentSubmissions = async (req, res) => {
    // Get all submissions for a specific Assignment (for Prof reviewing)
    try {
        const { assignmentId } = req.params;

        // Get assignment details
        const [assignment] = await pool.query('SELECT * FROM assignments WHERE id = ?', [assignmentId]);
        if (assignment.length === 0) return res.status(404).json({ message: 'Asignación no encontrada' });

        // Get all students in course (to show pending ones too)
        // Need courseId from assignment
        const courseId = assignment[0].course_id;
        const [enrollments] = await pool.query(
            `SELECT u.id, u.full_name, u.email FROM enrollments e 
             JOIN users u ON e.student_id = u.id 
             WHERE e.course_id = ?`,
            [courseId]
        );

        // Get submissions
        const [submissions] = await pool.query(
            'SELECT * FROM assignment_submissions WHERE assignment_id = ?',
            [assignmentId]
        );

        // Merge
        const result = enrollments.map(student => {
            const sub = submissions.find(s => s.student_id === student.id);
            return {
                student,
                submission: sub || null
            };
        });

        res.json({ success: true, data: result, assignment: assignment[0] });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.gradeAssignment = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const { grade, feedback } = req.body;

        await pool.query(
            'UPDATE assignment_submissions SET grade = ?, feedback = ? WHERE id = ?',
            [grade, feedback || null, submissionId]
        );

        res.json({ success: true, message: 'Calificación guardada' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
