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

exports.updateUnit = async (req, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;
        await pool.query('UPDATE units SET title = ? WHERE id = ?', [title, id]);
        res.json({ success: true, message: 'Unidad actualizada' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteUnit = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM units WHERE id = ?', [id]);
        res.json({ success: true, message: 'Unidad eliminada' });
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

exports.updateActivity = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;
        const { title, description, content_url, max_score, due_date, questions } = req.body;

        // 1. Update basic info
        await connection.query(
            'UPDATE activities SET title = ?, description = ?, content_url = ?, max_score = ?, due_date = ? WHERE id = ?',
            [title, description, content_url, max_score, due_date, id]
        );

        // 2. If questions provided, replace them (Full overwrite strategy is easiest for MVP)
        if (questions) {
            // Get current type
            const [act] = await connection.query('SELECT type FROM activities WHERE id = ?', [id]);
            if (act.length === 0) throw new Error('Actividad no encontrada');

            if (act[0].type === 'QUIZ') {
                // Delete old questions (and options via cascade if set, otherwise manual)
                // Assuming DB has ON DELETE CASCADE for options -> questions.
                // But let's be safe: delete options first? 
                // Actually deleting questions should cascade to options if FK exists.
                // Let's invoke delete where activity_id matches.

                // First get old q ids to clean up options manually just in case
                const [oldQs] = await connection.query('SELECT id FROM activity_questions WHERE activity_id = ?', [id]);
                const oldQIds = oldQs.map(q => q.id);
                if (oldQIds.length > 0) {
                    await connection.query(`DELETE FROM activity_options WHERE question_id IN (${oldQIds.join(',')})`);
                    await connection.query('DELETE FROM activity_questions WHERE activity_id = ?', [id]);
                }

                // Insert new
                for (const q of questions) {
                    const [qRes] = await connection.query('INSERT INTO activity_questions (activity_id, question_text) VALUES (?, ?)', [id, q.text]);
                    const qId = qRes.insertId;
                    for (const opt of q.options) {
                        await connection.query('INSERT INTO activity_options (question_id, option_text, is_correct) VALUES (?, ?, ?)',
                            [qId, opt.text, opt.isCorrect]);
                    }
                }
            }
        }

        await connection.commit();
        res.json({ success: true, message: 'Actividad actualizada' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};

exports.deleteActivity = async (req, res) => {
    try {
        const { id } = req.params;
        // Cascading deletion should be handled by DB, but let's be explicit if needed.
        // Assuming ON DELETE CASCADE on questions/options/submissions.
        // If not, we might error. Let's try simple delete first.

        // Manual cleanup to be safe:
        // 1. Delete Submissions
        await pool.query('DELETE FROM submissions WHERE activity_id = ?', [id]);

        // 2. Delete Questions/Options (If Quiz)
        const [qs] = await pool.query('SELECT id FROM activity_questions WHERE activity_id = ?', [id]);
        if (qs.length > 0) {
            const qIds = qs.map(q => q.id);
            await pool.query(`DELETE FROM activity_options WHERE question_id IN (${qIds.join(',')})`);
            await pool.query('DELETE FROM activity_questions WHERE activity_id = ?', [id]);
        }

        // 3. Delete Activity
        await pool.query('DELETE FROM activities WHERE id = ?', [id]);

        res.json({ success: true, message: 'Actividad eliminada' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
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
                        is_correct: o.is_correct
                    }))
                }));
            } else {
                activity.questions = [];
            }

            // Security: Hide correct answers from students UNLESS they completed it
            if (req.user && req.user.role === 'ESTUDIANTE') {
                // Check if completed submission exists
                const [subs] = await pool.query('SELECT status FROM submissions WHERE activity_id = ? AND student_id = ?', [id, req.user.id]);
                const isCompleted = subs.length > 0 && subs[0].status === 'COMPLETED';

                if (!isCompleted) {
                    activity.questions.forEach(q => {
                        q.options.forEach(o => delete o.is_correct);
                    });
                }
            }
        }

        // [NEW] Get student's previous submission if exists
        if (req.user && req.user.role === 'ESTUDIANTE') {
            const [subs] = await pool.query('SELECT * FROM submissions WHERE activity_id = ? AND student_id = ?', [id, req.user.id]);
            if (subs.length > 0) {
                activity.last_submission = subs[0];
            }
        }

        res.json({ success: true, data: activity });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

exports.submitActivity = async (req, res) => {
    try {
        const { activity_id, content, status = 'COMPLETED' } = req.body; // status: 'IN_PROGRESS' or 'COMPLETED'
        const student_id = req.user.id;

        // Check type to auto-grade
        const [act] = await pool.query('SELECT type FROM activities WHERE id = ?', [activity_id]);
        let grade = null;
        let feedback = null;

        // Only grade if COMPLETED and it is a QUIZ
        if (status === 'COMPLETED' && act.length && act[0].type === 'QUIZ') {
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
            // If updating, only update grade if we calculated one (kept as null if in_progress)
            // If status is IN_PROGRESS, grade becomes NULL (or keeps previous? Standard is clear grade if re-saving in progress? Or keeps null).
            // Actually, if I pause, I shouldn't overwrite a valid grade if I had one? 
            // User requirement: "si quiere volver a hacer... se va a reemplazar su progreso".
            // So yes, overwrite.
            await pool.query('UPDATE submissions SET content = ?, grade = ?, feedback = ?, status = ?, submitted_at = NOW() WHERE id = ?',
                [content, grade, feedback, status, existing[0].id]);
        } else {
            await pool.query('INSERT INTO submissions (activity_id, student_id, content, grade, feedback, status) VALUES (?, ?, ?, ?, ?, ?)',
                [activity_id, student_id, content, grade, feedback, status]);
        }

        res.json({ success: true, message: status === 'COMPLETED' ? 'Actividad entregada' : 'Progreso guardado', grade });
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
