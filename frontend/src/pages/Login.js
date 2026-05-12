// frontend/src/pages/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../api';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true); // Toggle between Login/Register
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Login
        const res = await loginUser({ email: formData.email, password: formData.password });
        login(res.data.user, res.data.token);

        // Redirect based on role
        if (res.data.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        // Register
        await registerUser(formData);
        setError('');
        alert('Registration successful! Please login.');
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🎯 QuizApp</h1>
        <h2 style={styles.subtitle}>{isLogin ? 'Login' : 'Create Account'}</h2>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Username</label>
              <input
                style={styles.input}
                type="text"
                name="username"
                placeholder="Enter username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              name="email"
              placeholder="Enter email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              name="password"
              placeholder="Enter password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
          </button>
        </form>

        <p style={styles.toggleText}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <span style={styles.link} onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Register' : 'Login'}
          </span>
        </p>

        <div style={styles.demo}>
          <strong>Demo Credentials:</strong><br />
          Admin: admin@quiz.com / admin123<br />
          User: john@example.com / user123
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px'
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    padding: '40px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
  },
  title: { textAlign: 'center', color: '#333', marginBottom: '5px', fontSize: '32px' },
  subtitle: { textAlign: 'center', color: '#666', marginBottom: '25px', fontWeight: 'normal' },
  error: {
    background: '#ffe0e0', color: '#d00', padding: '10px 15px',
    borderRadius: '6px', marginBottom: '15px', fontSize: '14px'
  },
  formGroup: { marginBottom: '18px' },
  label: { display: 'block', marginBottom: '6px', color: '#555', fontWeight: '600', fontSize: '14px' },
  input: {
    width: '100%', padding: '12px 15px', border: '2px solid #e0e0e0',
    borderRadius: '8px', fontSize: '15px', outline: 'none',
    boxSizing: 'border-box', transition: 'border 0.2s'
  },
  button: {
    width: '100%', padding: '13px', background: '#667eea', color: 'white',
    border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600',
    cursor: 'pointer', marginTop: '5px'
  },
  toggleText: { textAlign: 'center', marginTop: '20px', color: '#666' },
  link: { color: '#667eea', cursor: 'pointer', fontWeight: '600' },
  demo: {
    marginTop: '20px', padding: '12px', background: '#f5f5f5',
    borderRadius: '8px', fontSize: '13px', color: '#666', lineHeight: '1.8'
  }
};

export default Login;
