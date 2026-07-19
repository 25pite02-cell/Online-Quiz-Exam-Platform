import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser, googleLogin } from '../api';
import { useAuth } from '../context/AuthContext';

const GOOGLE_CLIENT_ID = '1039038219853-is9itifl26snj8irpelluc28fdttpjc2.apps.googleusercontent.com';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true); // Toggle between Login/Register
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleGoogleResponse = useCallback(async (response) => {
    setLoading(true);
    setError('');
    try {
      const res = await googleLogin(response.credential);
      login(res.data.user, res.data.token);
      if (res.data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Google login failed.');
    } finally {
      setLoading(false);
    }
  }, [login, navigate]);

  useEffect(() => {
    const initializeGoogle = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse
        });
        const el = document.getElementById('googleSignInDiv');
        if (el) {
          window.google.accounts.id.renderButton(el, {
            theme: 'outline',
            size: 'large',
            width: 380,
            text: 'continue_with'
          });
        }
      }
    };

    if (window.google) {
      initializeGoogle();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogle;
      document.body.appendChild(script);
    }
  }, [handleGoogleResponse]);

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

        <div id="googleSignInDiv" style={styles.googleBtnWrap}></div>

        <div style={styles.divider}>
          <span style={styles.dividerLine}></span>
          <span style={styles.dividerText}>OR</span>
          <span style={styles.dividerLine}></span>
        </div>

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
  googleBtnWrap: { display: 'flex', justifyContent: 'center', marginBottom: '15px' },
  divider: { display: 'flex', alignItems: 'center', gap: '10px', margin: '15px 0' },
  dividerLine: { flex: 1, height: '1px', background: '#e0e0e0' },
  dividerText: { color: '#999', fontSize: '12px', fontWeight: '600' },
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
