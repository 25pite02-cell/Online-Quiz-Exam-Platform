// backend/routes/attempt.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Quiz = require('../models/Quiz');
const Attempt = require('../models/Attempt');
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
    const quiz = await Quiz.findOne({ _id: quiz_id, is_active: true });
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found or not active.' });
    }

    const existing = await Attempt.findOne({
      user_id: userId,
      quiz_id,
      submitted_at: null
    });

    if (existing) {
      return res.json({ message: 'Resuming existing attempt.', attemptId: existing._id });
    }

    const attempt = await Attempt.create({ user_id: userId, quiz_id });

    res.status(201).json({ message: 'Quiz started!', attemptId: attempt._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// =============================================
// POST /api/attempts/submit - Submit quiz answers
// =============================================
router.post('/submit', verifyToken, async (req, res) => {
  const { attempt_id, answers, warnings } = req.body;
  // answers = [{ question_id: '...', selected_answer: 'A' }, ...]

  if (!attempt_id || !answers) {
    return res.status(400).json({ message: 'attempt_id and answers are required.' });
  }

  try {
    const attempt = await Attempt.findOne({ _id: attempt_id, user_id: req.user.id });
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found.' });
    }
    if (attempt.submitted_at) {
      return res.status(400).json({ message: 'This attempt has already been submitted.' });
    }

    const quiz = await Quiz.findById(attempt.quiz_id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }
    const questions = quiz.questions || [];

    let score = 0;
    let totalMarks = 0;
    const savedAnswers = [];

    for (const question of questions) {
      totalMarks += Number(question.marks || 0);

      const userAnswer = answers.find(
        (a) => String(a.question_id) === String(question._id)
      );

      const selectedAnswer = userAnswer
        ? String(userAnswer.selected_answer).trim().toUpperCase()
        : null;

      const correctAnswer = question.correct_answer
        ? String(question.correct_answer).trim().toUpperCase()
        : null;

      const isCorrect = selectedAnswer === correctAnswer;

      if (isCorrect) {
        score += Number(question.marks || 0);
      }

      savedAnswers.push({
        question_id: question._id,
        selected_answer: selectedAnswer,
        is_correct: isCorrect
      });
    }

    const timeTaken = Math.floor((new Date() - new Date(attempt.started_at)) / 1000);

    attempt.score = score;
    attempt.total_marks = totalMarks;
    attempt.submitted_at = new Date();
    attempt.time_taken = timeTaken;
    attempt.warnings = Number(warnings) || 0;
    attempt.answers = savedAnswers;
    await attempt.save();

    res.json({
      message: 'Quiz submitted successfully!',
      score,
      totalMarks,
      percentage: totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0,
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
    const attempts = await Attempt.find({ user_id: req.user.id, submitted_at: { $ne: null } })
      .populate('quiz_id', 'title time_limit')
      .sort({ submitted_at: -1 });

    const result = attempts.map((a) => ({
      id: a._id,
      quiz_title: a.quiz_id?.title,
      time_limit: a.quiz_id?.time_limit,
      score: a.score,
      total_marks: a.total_marks,
      time_taken: a.time_taken,
      submitted_at: a.submitted_at
    }));

    res.json(result);
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
    // Admin can view any attempt; students can only view their own
    const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, user_id: req.user.id };
    const attempt = await Attempt.findOne(query)
      .populate('quiz_id', 'title');

    if (!attempt) {
      return res.status(404).json({ message: 'Result not found.' });
    }

    const quiz = await Quiz.findById(attempt.quiz_id);
    const questionMap = {};
    (quiz?.questions || []).forEach((q) => {
      questionMap[q._id.toString()] = q;
    });

    const answers = attempt.answers.map((a) => {
      const q = questionMap[a.question_id.toString()] || {};
      return {
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer,
        selected_answer: a.selected_answer,
        is_correct: a.is_correct,
        marks: q.marks
      };
    });

    res.json({
      id: attempt._id,
      quiz_id: attempt.quiz_id?._id,
      quiz_title: attempt.quiz_id?.title,
      score: attempt.score,
      total_marks: attempt.total_marks,
      time_taken: attempt.time_taken,
      submitted_at: attempt.submitted_at,
      answers
    });
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
    const leaderboard = await Attempt.aggregate([
      {
        $match: {
          quiz_id: new mongoose.Types.ObjectId(req.params.quizId),
          submitted_at: { $ne: null }
        }
      },
      {
        $group: {
          _id: '$user_id',
          best_score: { $max: '$score' },
          best_time: { $min: '$time_taken' },
          total_marks: { $first: '$total_marks' },
          attempts_count: { $sum: 1 }
        }
      },
      { $sort: { best_score: -1, best_time: 1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          username: '$user.username',
          best_score: 1,
          total_marks: 1,
          best_time: 1,
          attempts_count: 1,
          percentage: {
            $round: [{ $multiply: [{ $divide: ['$best_score', '$total_marks'] }, 100] }, 0]
          }
        }
      }
    ]);

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
    const attempts = await Attempt.find({ submitted_at: { $ne: null } })
      .populate('user_id', 'username')
      .populate('quiz_id', 'title')
      .sort({ submitted_at: -1 });

    const result = attempts.map((a) => ({
      id: a._id,
      username: a.user_id?.username,
      quiz_title: a.quiz_id?.title,
      score: a.score,
      total_marks: a.total_marks,
      time_taken: a.time_taken,
      warnings: a.warnings,
      submitted_at: a.submitted_at
    }));

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
