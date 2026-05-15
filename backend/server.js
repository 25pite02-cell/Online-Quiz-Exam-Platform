const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB
connectDB();

app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quiz');
const attemptRoutes = require('./routes/attempt');

app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/attempts', attemptRoutes);

app.get('/', (req, res) => {
  res.json({ message: '🎯 Quiz App API is running!' });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
