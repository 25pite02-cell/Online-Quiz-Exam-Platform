// backend/models/Attempt.js
const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    question_id: { type: mongoose.Schema.Types.ObjectId }, // refers to an embedded question inside Quiz.questions
    selected_answer: String,
    is_correct: Boolean
  },
  { _id: false }
);

const attemptSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quiz_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  started_at: { type: Date, default: Date.now },
  submitted_at: { type: Date, default: null },
  score: { type: Number, default: 0 },
  total_marks: { type: Number, default: 0 },
  time_taken: { type: Number, default: 0 }, // seconds
  answers: [answerSchema]
});

module.exports = mongoose.model('Attempt', attemptSchema);
