// backend/models/Question.js
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  quiz_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  question_text: { type: String, required: true },
  option_a: { type: String, required: true },
  option_b: { type: String, required: true },
  option_c: { type: String, required: true },
  option_d: { type: String, required: true },
  correct_answer: { type: String, required: true }, // 'A' | 'B' | 'C' | 'D'
  marks: { type: Number, default: 1 }
});

module.exports = mongoose.model('Question', questionSchema);
