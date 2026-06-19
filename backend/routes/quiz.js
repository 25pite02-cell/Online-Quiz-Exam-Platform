// backend/routes/quiz.js
const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// =============================================
// GET /api/quizzes - Get all active quizzes (for users)
// =============================================
router.get('/', verifyToken, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ is_active: true })
      .populate('created_by', 'username')
      .sort({ created_at: -1 });

    const result = await Promise.all(
      quizzes.map(async (q) => {
        const total_questions = await Question.countDocuments({ quiz_id: q._id });
        return {
          id: q._id,
          _id: q._id,
          title: q.title,
          description: q.description,
          time_limit: q.time_limit,
          randomize_questions: q.randomize_questions,
          created_by: q.created_by?.username || '',
          total_questions
        };
      })
    );

    res.json(result);
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
    const quizzes = await Quiz.find()
      .populate('created_by', 'username')
      .sort({ created_at: -1 });

    const result = await Promise.all(
      quizzes.map(async (q) => {
        const total_questions = await Question.countDocuments({ quiz_id: q._id });
        return {
          id: q._id,
          _id: q._id,
          title: q.title,
          description: q.description,
          time_limit: q.time_limit,
          randomize_questions: q.randomize_questions,
          is_active: q.is_active,
          created_by_name: q.created_by?.username || '',
          total_questions
        };
      })
    );

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// =============================================
// GET /api/quizzes/:id - Get single quiz with questions
// =============================================
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('created_by', 'username');
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    let questions = await Question.find({ quiz_id: quiz._id }).lean();

    if (quiz.randomize_questions) {
      questions = questions.sort(() => Math.random() - 0.5);
    }

    // Remove correct_answer from questions before sending to user (not admin)
    if (req.user.role !== 'admin') {
      questions = questions.map(({ correct_answer, ...rest }) => rest);
    }

    res.json({
      id: quiz._id,
      _id: quiz._id,
      title: quiz.title,
      description: quiz.description,
      time_limit: quiz.time_limit,
      randomize_questions: quiz.randomize_questions,
      created_by_name: quiz.created_by?.username || '',
      questions
    });
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
    const quiz = await Quiz.create({
      title,
      description: description || '',
      time_limit,
      randomize_questions: randomize_questions || false,
      created_by: req.user.id
    });

    const questionDocs = questions.map((q) => ({
      quiz_id: quiz._id,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_answer: q.correct_answer,
      marks: q.marks || 1
    }));

    await Question.insertMany(questionDocs);

    res.status(201).json({ message: 'Quiz created successfully!', quizId: quiz._id });
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

  try {
    await Quiz.findByIdAndUpdate(req.params.id, {
      title,
      description,
      time_limit,
      is_active,
      randomize_questions
    });
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
    await Quiz.findByIdAndDelete(req.params.id);
    await Question.deleteMany({ quiz_id: req.params.id });
    res.json({ message: 'Quiz deleted successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
