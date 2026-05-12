// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// =============================================
// MIDDLEWARE
// =============================================
app.use(cors()); // Allow cross-origin requests from React frontend
app.use(express.json()); // Parse JSON request bodies

// =============================================
// ROUTES
// =============================================
const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quiz');
const attemptRoutes = require('./routes/attempt');

app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/attempts', attemptRoutes);

// Root route - just to test server is running
app.get('/', (req, res) => {
  res.json({ message: '🎯 Quiz App API is running!' });
});

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// =============================================
// START SERVER
// =============================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
