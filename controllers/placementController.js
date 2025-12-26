const db = require('../config/db');

exports.getTestsByLanguage = async (req, res) => {
    try {
        const { language } = req.params;
        const [tests] = await db.pool.query('SELECT * FROM placement_tests WHERE language = ?', [language]);
        res.json({ success: true, data: tests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createTest = async (req, res) => {
    try {
        const { language, title, description } = req.body;
        const [result] = await db.pool.query('INSERT INTO placement_tests (language, title, description) VALUES (?, ?, ?)', [language, title, description]);
        res.json({ success: true, testId: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateTest = async (req, res) => {
    try {
        const { testId } = req.params;
        const { title, description } = req.body;
        await db.pool.query('UPDATE placement_tests SET title = ?, description = ? WHERE id = ?', [title, description, testId]);
        res.json({ success: true, message: 'Test updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getTestDetails = async (req, res) => {
    try {
        const { testId } = req.params;
        const [tests] = await db.pool.query('SELECT * FROM placement_tests WHERE id = ?', [testId]);
        if (tests.length === 0) return res.status(404).json({ success: false, message: 'Test not found' });

        const test = tests[0];

        // Fetch questions
        const [questions] = await db.pool.query('SELECT * FROM placement_questions WHERE test_id = ?', [testId]);

        // Fetch options for all questions
        const questionIds = questions.map(q => q.id);
        let options = [];
        if (questionIds.length > 0) {
            const [opts] = await db.pool.query(`SELECT * FROM placement_options WHERE question_id IN (${questionIds.join(',')})`);
            options = opts;
        }

        // Attach options to questions
        const questionsWithOptions = questions.map(q => ({
            ...q,
            options: options.filter(o => o.question_id === q.id)
        }));

        res.json({ success: true, data: { ...test, questions: questionsWithOptions } });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.addQuestion = async (req, res) => {
    try {
        const { testId } = req.params;
        const { questionText, options } = req.body; // options: [{text: 'A', isCorrect: true}, ...]

        const [qRes] = await db.pool.query('INSERT INTO placement_questions (test_id, question_text) VALUES (?, ?)', [testId, questionText]);
        const questionId = qRes.insertId;

        for (const opt of options) {
            await db.pool.query('INSERT INTO placement_options (question_id, option_text, is_correct) VALUES (?, ?, ?)',
                [questionId, opt.text, opt.isCorrect]);
        }

        res.json({ success: true, message: 'Question added' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;
        await db.pool.query('DELETE FROM placement_questions WHERE id = ?', [questionId]);
        res.json({ success: true, message: 'Question deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteTest = async (req, res) => {
    try {
        const { testId } = req.params;
        await db.pool.query('DELETE FROM placement_tests WHERE id = ?', [testId]);
        res.json({ success: true, message: 'Test deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.submitTest = async (req, res) => {
    try {
        const { testId } = req.params;
        const { answers } = req.body; // { questionId: optionId, ... }
        const userId = req.user ? req.user.id : 0; // If user is logged in

        // Calculate score
        const [questions] = await db.pool.query('SELECT * FROM placement_questions WHERE test_id = ?', [testId]);
        const questionIds = questions.map(q => q.id);

        if (questionIds.length === 0) return res.json({ success: true, score: 0 });

        const [correctOptions] = await db.pool.query(`SELECT * FROM placement_options WHERE question_id IN (${questionIds.join(',')}) AND is_correct = 1`);

        let correctCount = 0;
        correctOptions.forEach(opt => {
            if (answers[opt.question_id] == opt.id) {
                correctCount++;
            }
        });

        const score = (correctCount / questions.length) * 100;

        // Save result
        if (userId) {
            await db.pool.query('INSERT INTO placement_results (user_id, test_id, score) VALUES (?, ?, ?)', [userId, testId, score]);
        }

        res.json({ success: true, score, correctCount, total: questions.length });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
