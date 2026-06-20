// backend/models/Quiz.js
const mongoose = require('mongoose');

// Questions are stored embedded inside the quiz document (matches existing data in Atlas)
const questionSchema = new mongoose.Schema({
  question_text: { type: String, required: true },
  option_a: { type: String, required: true },
  option_b: { type: String, required: true },
  option_c: { type: String, required: true },
  option_d: { type: String, required: true },
  correct_answer: { type: String, required: true }, // 'A' | 'B' | 'C' | 'D'
  marks: { type: Number, default: 1 }
});

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    time_limit: { type: Number, required: true }, // in minutes
    randomize_questions: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    questions: { type: [questionSchema], default: [] }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('Quiz', quizSchema);
