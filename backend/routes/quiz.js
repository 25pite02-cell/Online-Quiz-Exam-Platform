// backend/routes/quiz.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// =============================================
// GET /api/quizzes - Get all active quizzes (for users)
// =============================================
router.get('/', verifyToken, async (req, res) => {
  try {
    const [quizzes] = await db.query(
      `SELECT q.id, q.title, q.description, q.time_limit, q.randomize_questions,
              u.username AS created_by,
              COUNT(qs.id) AS total_questions
       FROM quizzes q
       JOIN users u ON q.created_by = u.id
       LEFT JOIN questions qs ON q.id = qs.quiz_id
       WHERE q.is_active = TRUE
       GROUP BY q.id
       ORDER BY q.created_at DESC`
    );
    res.json(quizzes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// =============================================
// GET /api/quizzes/all - Get ALL quizzes (admin only)
// =============================================
router.get('/all', verifyAdmin, async (req, res) => {
  try {
    const [quizzes] = await db.query(
      `SELECT q.*, u.username AS created_by_name,
              COUNT(qs.id) AS total_questions
       FROM quizzes q
       JOIN users u ON q.created_by = u.id
       LEFT JOIN questions qs ON q.id = qs.quiz_id
       GROUP BY q.id
       ORDER BY q.created_at DESC`
    );
    res.json(quizzes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// =============================================
// GET /api/quizzes/:id - Get single quiz with questions
// =============================================
router.get('/:id', verifyToken, async (req, res) => {
  const quizId = req.params.id;

  try {
    // Get quiz info
    const [quizRows] = await db.query(
      `SELECT q.*, u.username AS created_by_name
       FROM quizzes q
       JOIN users u ON q.created_by = u.id
       WHERE q.id = ?`,
      [quizId]
    );

    if (quizRows.length === 0) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const quiz = quizRows[0];

    // Get questions for the quiz
    let [questions] = await db.query(
      'SELECT * FROM questions WHERE quiz_id = ?',
      [quizId]
    );

    // Randomize if enabled
    if (quiz.randomize_questions) {
      questions = questions.sort(() => Math.random() - 0.5);
    }

    // Remove correct_answer from questions before sending to user (not admin)
    if (req.user.role !== 'admin') {
      questions = questions.map(q => {
        const { correct_answer, ...rest } = q;
        return rest;
      });
    }

    res.json({ ...quiz, questions });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// =============================================
// POST /api/quizzes - Create new quiz (admin only)
// =============================================
router.post('/', verifyAdmin, async (req, res) => {
  const { title, description, time_limit, randomize_questions, questions } = req.body;

  if (!title || !time_limit) {
    return res.status(400).json({ message: 'Title and time limit are required.' });
  }

  if (!questions || questions.length === 0) {
    return res.status(400).json({ message: 'At least one question is required.' });
  }

  try {
    // Insert quiz
    const [quizResult] = await db.query(
      `INSERT INTO quizzes (title, description, time_limit, created_by, randomize_questions)
       VALUES (?, ?, ?, ?, ?)`,
      [title, description || '', time_limit, req.user.id, randomize_questions || false]
    );

    const quizId = quizResult.insertId;

    // Insert all questions
    for (const q of questions) {
      await db.query(
        `INSERT INTO questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, marks)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [quizId, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, q.marks || 1]
      );
    }

    res.status(201).json({ message: 'Quiz created successfully!', quizId });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// =============================================
// PUT /api/quizzes/:id - Update quiz (admin only)
// =============================================
router.put('/:id', verifyAdmin, async (req, res) => {
  const { title, description, time_limit, is_active, randomize_questions } = req.body;
  const quizId = req.params.id;

  try {
    await db.query(
      `UPDATE quizzes SET title=?, description=?, time_limit=?, is_active=?, randomize_questions=?
       WHERE id=?`,
      [title, description, time_limit, is_active, randomize_questions, quizId]
    );
    res.json({ message: 'Quiz updated successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// =============================================
// DELETE /api/quizzes/:id - Delete quiz (admin only)
// =============================================
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM quizzes WHERE id = ?', [req.params.id]);
    res.json({ message: 'Quiz deleted successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
