// frontend/src/api.js
// Central place for all API calls

import axios from 'axios';

// Create axios instance pointing to our backend
const API = axios.create({
  baseURL: 'https://quiz-backend-production-5ffb.up.railway.app'
});

// Auto-attach JWT token to every request if user is logged in
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// =============================================
// AUTH APIs
// =============================================
export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);

// =============================================
// QUIZ APIs
// =============================================
export const getActiveQuizzes = () => API.get('/quizzes');
export const getAllQuizzes = () => API.get('/quizzes/all');       // Admin only
export const getQuizById = (id) => API.get(`/quizzes/${id}`);
export const createQuiz = (data) => API.post('/quizzes', data);
export const updateQuiz = (id, data) => API.put(`/quizzes/${id}`, data);
export const deleteQuiz = (id) => API.delete(`/quizzes/${id}`);

// =============================================
// ATTEMPT APIs
// =============================================
export const startAttempt = (quizId) => API.post('/attempts/start', { quiz_id: quizId });
export const submitAttempt = (attemptId, answers) =>
  API.post('/attempts/submit', { attempt_id: attemptId, answers });
export const getMyAttempts = () => API.get('/attempts/my');
export const getAttemptResult = (attemptId) => API.get(`/attempts/${attemptId}/result`);
export const getLeaderboard = (quizId) => API.get(`/attempts/leaderboard/${quizId}`);
export const getAllAttempts = () => API.get('/attempts/admin/all'); // Admin only

export default API;
