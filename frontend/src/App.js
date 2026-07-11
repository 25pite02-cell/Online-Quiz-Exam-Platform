// frontend/src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TakeQuiz from './pages/TakeQuiz';
import Result from './pages/Result';
import Leaderboard from './pages/Leaderboard';
import AdminDashboard from './pages/AdminDashboard';
import CreateQuiz from './pages/CreateQuiz';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public route */}
          <Route path="/" element={<Login />} />

          {/* User routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/quiz/:id" element={
            <ProtectedRoute><TakeQuiz /></ProtectedRoute>
          } />
          <Route path="/result/:id" element={
            <ProtectedRoute><Result /></ProtectedRoute>
          } />
          <Route path="/leaderboard/:quizId" element={
            <ProtectedRoute><Leaderboard /></ProtectedRoute>
          } />

          {/* Admin only routes */}
          <Route path="/admin" element={
            <ProtectedRoute adminOnly={true}><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/admin/create-quiz" element={
            <ProtectedRoute adminOnly={true}><CreateQuiz /></ProtectedRoute>
          } />
          <Route path="/admin/edit-quiz/:id" element={
  <ProtectedRoute adminOnly={true}><CreateQuiz /></ProtectedRoute>
} />
          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
