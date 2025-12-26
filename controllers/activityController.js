const { pool } = require('../config/db');

exports.createUnit = async (req, res) => {
    try {
        const { course_id, title, order_index } = req.body;
        await pool.query('INSERT INTO units (course_id, title, order_index) VALUES (?, ?, ?)',
            [course_id, title, order_index]);
        res.json({ success: true, message: 'Unidad creada' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createActivity = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { unit_id, title, description, type, content_url, max_score, due_date, questions } = req.body;

        const [result] = await connection.query(
            `INSERT INTO activities (unit_id, title, description, type, content_url, max_score, due_date) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [unit_id, title, description, type, content_url, max_score, due_date]
        );
        const activityId = result.insertId;

        if (type === 'QUIZ' && questions && questions.length > 0) {
            for (const q of questions) {
                const [qRes] = await connection.query('INSERT INTO activity_questions (activity_id, question_text) VALUES (?, ?)', [activityId, q.text]);
                const qId = qRes.insertId;
                for (const opt of q.options) {
                    await connection.query('INSERT INTO activity_options (question_id, option_text, is_correct) VALUES (?, ?, ?)',
                        [qId, opt.text, opt.isCorrect]);
                }
            }
        }

        await connection.commit();
        res.json({ success: true, message: 'Actividad creada' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};

exports.getActivity = async (req, res) => {
    try {
        const { id } = req.params;
        const [acts] = await pool.query('SELECT * FROM activities WHERE id = ?', [id]);
        if (!acts.length) return res.status(404).json({ message: 'Actividad no encontrada' });

        const activity = acts[0];

        if (activity.type === 'QUIZ') {
            const [qs] = await pool.query('SELECT * FROM activity_questions WHERE activity_id = ?', [id]);
            if (qs.length > 0) {
                const qIds = qs.map(q => q.id);
                const [opts] = await pool.query(`SELECT * FROM activity_options WHERE question_id IN (${qIds.join(',')})`);

                activity.questions = qs.map(q => ({
                    id: q.id,
                    text: q.question_text,
                    options: opts.filter(o => o.question_id === q.id).map(o => ({
                        id: o.id,
                        text: o.option_text,
                        is_correct: o.is_correct // Will be filtered for students if needed
                    }))
                }));
            } else {
                activity.questions = [];
            }

            // Security: Hide correct answers from students
            if (req.user && req.user.role === 'ESTUDIANTE') {
                activity.questions.forEach(q => {
                    q.options.forEach(o => delete o.is_correct);
                });
            }
        }

        res.json({ success: true, data: activity });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

exports.submitActivity = async (req, res) => {
    try {
        const { activity_id, content } = req.body; // content is JSON string for quizzes
        const student_id = req.user.id;

        // Check type to auto-grade
        const [act] = await pool.query('SELECT type FROM activities WHERE id = ?', [activity_id]);
        let grade = null;
        let feedback = null;

        if (act.length && act[0].type === 'QUIZ') {
            try {
                const answers = JSON.parse(content); // { questionId: optionId }

                const [qs] = await pool.query('SELECT id FROM activity_questions WHERE activity_id = ?', [activity_id]);
                const qIds = qs.map(q => q.id);

                if (qIds.length > 0) {
                    const [correctOpts] = await pool.query(`SELECT * FROM activity_options WHERE question_id IN (${qIds.join(',')}) AND is_correct = 1`);
                    let correctCount = 0;

                    correctOpts.forEach(o => {
                        if (answers[o.question_id] == o.id) correctCount++;
                    });

                    grade = (correctCount / qs.length) * 100; // Scale to 100
                    feedback = `Auto-calificado: ${correctCount}/${qs.length} correctas.`;
                } else {
                    grade = 0;
                }
            } catch (e) {
                console.error('Error parsing quiz answers', e);
            }
        }

        // Upsert submission
        const [existing] = await pool.query(
            'SELECT id FROM submissions WHERE activity_id = ? AND student_id = ?',
            [activity_id, student_id]
        );

        if (existing.length > 0) {
            await pool.query('UPDATE submissions SET content = ?, grade = COALESCE(?, grade), feedback = COALESCE(?, feedback), submitted_at = NOW() WHERE id = ?',
                [content, grade, feedback, existing[0].id]);
        } else {
            await pool.query('INSERT INTO submissions (activity_id, student_id, content, grade, feedback) VALUES (?, ?, ?, ?, ?)',
                [activity_id, student_id, content, grade, feedback]);
        }

        res.json({ success: true, message: 'Actividad entregada', grade });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.gradeSubmission = async (req, res) => {
    try {
        const { submission_id, grade, feedback } = req.body;
        await pool.query('UPDATE submissions SET grade = ?, feedback = ? WHERE id = ?',
            [grade, feedback, submission_id]);
        res.json({ success: true, message: 'Calificación guardada' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
