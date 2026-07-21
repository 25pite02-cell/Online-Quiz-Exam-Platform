import axios from 'axios';

const API = axios.create({
  baseURL: 'https://quiz-backend-gvwg.onrender.com/api'
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);
export const googleLogin = (credential) => API.post('/auth/google', { credential });
export const getAllUsers = () => API.get('/auth/admin/users');
export const updateUserRole = (userId, role) => API.put(`/auth/admin/users/${userId}/role`, { role });
export const getActiveQuizzes = () => API.get('/quizzes');
export const getAllQuizzes = () => API.get('/quizzes/all');
export const getQuizById = (id) => API.get(`/quizzes/${id}`);
export const createQuiz = (data) => API.post('/quizzes', data);
export const updateQuiz = (id, data) => API.put(`/quizzes/${id}`, data);
export const deleteQuiz = (id) => API.delete(`/quizzes/${id}`);
export const startAttempt = (quizId) => API.post('/attempts/start', { quiz_id: quizId });
export const submitAttempt = (attemptId, answers, warnings) => API.post('/attempts/submit', { attempt_id: attemptId, answers, warnings });
export const getMyAttempts = () => API.get('/attempts/my');
export const getAttemptResult = (attemptId) => API.get(`/attempts/${attemptId}/result`);
export const getLeaderboard = (quizId) => API.get(`/attempts/leaderboard/${quizId}`);
export const getAllAttempts = () => API.get('/attempts/admin/all');

export default API;
