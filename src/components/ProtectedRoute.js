// frontend/src/components/ProtectedRoute.js
// This component protects routes from unauthorized access

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Protects routes - redirects to login if not authenticated
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  // Wait until auth state is checked
  if (loading) return <div style={{ textAlign: 'center', padding: '80px' }}>Loading...</div>;

  // Not logged in - redirect to login
  if (!user) return <Navigate to="/" replace />;

  // Admin only route - redirect if not admin
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return children;
};

export default ProtectedRoute;
