// backend/models/User.js
const mongoose = require('mongoose');
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: function () { return !this.googleId; } },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    googleId: { type: String, default: null }
  },
  { timestamps: true }
);
module.exports = mongoose.model('User', userSchema);
