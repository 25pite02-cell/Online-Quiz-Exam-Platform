// backend/routes/attempt.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// =============================================
// POST /api/attempts/start - Start a quiz attempt
// =============================================
router.post('/start', verifyToken, async (req, res) => {
  const { quiz_id } = req.body;
  const userId = req.user.id;

  if (!quiz_id) {
    return res.status(400).json({ message: 'quiz_id is required.' });
  }

  try {
    // Check if quiz exists and is active
    const [quizRows] = await db.query(
      'SELECT * FROM quizzes WHERE id = ? AND is_active = TRUE',
      [quiz_id]
    );

    if (quizRows.length === 0) {
      return res.status(404).json({ message: 'Quiz not found or not active.' });
    }

    // Check if user already has an incomplete attempt
    const [existing] = await db.query(
      'SELECT id FROM attempts WHERE user_id = ? AND quiz_id = ? AND submitted_at IS NULL',
      [userId, quiz_id]
    );

    if (existing.length > 0) {
      return res.json({
        message: 'Resuming existing attempt.',
        attemptId: existing[0].id
      });
    }

    // Create new attempt
    const [result] = await db.query(
      'INSERT INTO attempts (user_id, quiz_id) VALUES (?, ?)',
      [userId, quiz_id]
    );

    res.status(201).json({
      message: 'Quiz started!',
      attemptId: result.insertId
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// =============================================
// POST /api/attempts/submit - Submit quiz answers
// =============================================
router.post('/submit', verifyToken, async (req, res) => {
  const { attempt_id, answers } = req.body;
  // answers = [{ question_id: 1, selected_answer: 'A' }, ...]

  if (!attempt_id || !answers) {
    return res.status(400).json({ message: 'attempt_id and answers are required.' });
  }

  try {
    // Check attempt exists and belongs to this user
    const [attemptRows] = await db.query(
      'SELECT * FROM attempts WHERE id = ? AND user_id = ?',
      [attempt_id, req.user.id]
    );

    if (attemptRows.length === 0) {
      return res.status(404).json({ message: 'Attempt not found.' });
    }

    const attempt = attemptRows[0];

    if (attempt.submitted_at) {
      return res.status(400).json({ message: 'This attempt has already been submitted.' });
    }

    // Get all questions for this quiz
    const [questions] = await db.query(
      'SELECT id, correct_answer, marks FROM questions WHERE quiz_id = ?',
      [attempt.quiz_id]
    );

    let score = 0;
    let totalMarks = 0;

    // Evaluate each answer
    for (const question of questions) {
  totalMarks += Number(question.marks || 0);

  const userAnswer = answers.find(
    a => Number(a.question_id) === Number(question.id)
  );

  const selectedAnswer = userAnswer
    ? String(userAnswer.selected_answer).trim().toUpperCase()
    : null;

  const correctAnswer = question.correct_answer
    ? String(question.correct_answer).trim().toUpperCase()
    : null;

  console.log(
    "QID:", question.id,
    "Selected:", selectedAnswer,
    "Correct:", correctAnswer
  );

  const isCorrect = selectedAnswer === correctAnswer;

  if (isCorrect) {
    score += Number(question.marks || 0);
  }

  await db.query(
    `INSERT INTO attempt_answers
    (attempt_id, question_id, selected_answer, is_correct)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
    selected_answer = VALUES(selected_answer),
    is_correct = VALUES(is_correct)`,
    [
      attempt_id,
      question.id,
      selectedAnswer,
      isCorrect
    ]
  );
}

    // Calculate time taken (seconds)
    const timeTaken = Math.floor((new Date() - new Date(attempt.started_at)) / 1000);

    // Update attempt with score
    await db.query(
      `UPDATE attempts SET score=?, total_marks=?, submitted_at=NOW(), time_taken=?
       WHERE id=?`,
      [score, totalMarks, timeTaken, attempt_id]
    );

    res.json({
      message: 'Quiz submitted successfully!',
      score,
      totalMarks,
      percentage: Math.round((score / totalMarks) * 100),
      timeTaken
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// =============================================
// GET /api/attempts/my - Get current user's attempts
// =============================================
router.get('/my', verifyToken, async (req, res) => {
  try {
    const [attempts] = await db.query(
      `SELECT a.*, q.title AS quiz_title, q.time_limit
       FROM attempts a
       JOIN quizzes q ON a.quiz_id = q.id
       WHERE a.user_id = ? AND a.submitted_at IS NOT NULL
       ORDER BY a.submitted_at DESC`,
      [req.user.id]
    );
    res.json(attempts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// =============================================
// GET /api/attempts/:id/result - Get detailed result
// =============================================
router.get('/:id/result', verifyToken, async (req, res) => {
  try {
    // Get attempt info
    const [attemptRows] = await db.query(
      `SELECT a.*, q.title AS quiz_title
       FROM attempts a
       JOIN quizzes q ON a.quiz_id = q.id
       WHERE a.id = ? AND a.user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (attemptRows.length === 0) {
      return res.status(404).json({ message: 'Result not found.' });
    }

    const attempt = attemptRows[0];

    // Get all answers with question details
    const [answers] = await db.query(
      `SELECT q.question_text, q.option_a, q.option_b, q.option_c, q.option_d,
              q.correct_answer, aa.selected_answer, aa.is_correct, q.marks
       FROM attempt_answers aa
       JOIN questions q ON aa.question_id = q.id
       WHERE aa.attempt_id = ?`,
      [req.params.id]
    );

    res.json({ ...attempt, answers });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// =============================================
// GET /api/attempts/leaderboard/:quizId - Get leaderboard
// =============================================
router.get('/leaderboard/:quizId', verifyToken, async (req, res) => {
  try {
    const [leaderboard] = await db.query(
      `SELECT u.username,
              MAX(a.score) AS best_score,
              a.total_marks,
              MIN(a.time_taken) AS best_time,
              COUNT(a.id) AS attempts_count,
              ROUND((MAX(a.score) / a.total_marks) * 100) AS percentage
       FROM attempts a
       JOIN users u ON a.user_id = u.id
       WHERE a.quiz_id = ? AND a.submitted_at IS NOT NULL
       GROUP BY a.user_id
       ORDER BY best_score DESC, best_time ASC
       LIMIT 20`,
      [req.params.quizId]
    );
    res.json(leaderboard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// =============================================
// GET /api/attempts/admin/all - All attempts (admin)
// =============================================
router.get('/admin/all', verifyAdmin, async (req, res) => {
  try {
    const [attempts] = await db.query(
      `SELECT a.*, u.username, q.title AS quiz_title
       FROM attempts a
       JOIN users u ON a.user_id = u.id
       JOIN quizzes q ON a.quiz_id = q.id
       WHERE a.submitted_at IS NOT NULL
       ORDER BY a.submitted_at DESC`
    );
    res.json(attempts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
