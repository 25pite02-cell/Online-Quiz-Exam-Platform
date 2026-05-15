// backend/server.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
// =============================================
// MIDDLEWARE
// =============================================
app.use(cors());
app.use(express.json());

// =============================================
// ROUTES
// =============================================
const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quiz');
const attemptRoutes = require('./routes/attempt');

app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/attempts', attemptRoutes);

// =============================================
// ROOT ROUTE
// =============================================
app.get('/', (req, res) => {
  res.json({
    message: '🎯 Quiz App API is running!'
  });
});

// =============================================
// 404 HANDLER
// =============================================
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found'
  });
});

// =============================================
// START SERVER
// =============================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
