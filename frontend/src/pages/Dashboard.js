// frontend/src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActiveQuizzes, getMyAttempts } from '../api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('quizzes');

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [quizRes, attemptRes] = await Promise.all([
        getActiveQuizzes(),
        getMyAttempts()
      ]);
      setQuizzes(quizRes.data);
      setAttempts(attemptRes.data);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Check if user already completed this quiz
  const getAttemptForQuiz = (quizId) => {
    return attempts.find(a => a.quiz_id === quizId);
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.logo}>🎯 QuizApp</h1>
        <div style={styles.userInfo}>
          <span style={styles.welcome}>Welcome, {user?.username}!</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={styles.tabs}>
        <button
          style={activeTab === 'quizzes' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('quizzes')}
        >
          📚 Available Quizzes ({quizzes.length})
        </button>
        <button
          style={activeTab === 'history' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('history')}
        >
          📊 My Results ({attempts.length})
        </button>
      </div>

      <div style={styles.content}>
        {/* Quizzes Tab */}
        {activeTab === 'quizzes' && (
          <div>
            {quizzes.length === 0 ? (
              <div style={styles.empty}>No quizzes available at the moment.</div>
            ) : (
              <div style={styles.grid}>
                {quizzes.map(quiz => {
                  const attempt = getAttemptForQuiz(quiz.id);
                  return (
                    <div key={quiz.id} style={styles.quizCard}>
                      <h3 style={styles.quizTitle}>{quiz.title}</h3>
                      <p style={styles.quizDesc}>{quiz.description}</p>
                      <div style={styles.quizMeta}>
                        <span>⏱ {quiz.time_limit} min</span>
                        <span>❓ {quiz.total_questions} questions</span>
                        {quiz.randomize_questions && <span>🔀 Randomized</span>}
                      </div>

                      {attempt ? (
                        <div>
                          <div style={styles.scoreDisplay}>
                            Score: {attempt.score}/{attempt.total_marks}
                            ({Math.round((attempt.score / attempt.total_marks) * 100)}%)
                          </div>
                          <button
                            style={styles.viewBtn}
                            onClick={() => navigate(`/result/${attempt.id}`)}
                          >
                            View Result
                          </button>
                          <button
                            style={styles.leaderBtn}
                            onClick={() => navigate(`/leaderboard/${quiz.id}`)}
                          >
                            🏆 Leaderboard
                          </button>
                        </div>
                      ) : (
                        <button
                          style={styles.startBtn}
                          onClick={() => navigate(`/quiz/${quiz.id}`)}
                        >
                          Start Quiz →
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div>
            {attempts.length === 0 ? (
              <div style={styles.empty}>You haven't taken any quizzes yet.</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.th}>Quiz</th>
                    <th style={styles.th}>Score</th>
                    <th style={styles.th}>Percentage</th>
                    <th style={styles.th}>Time Taken</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map(attempt => (
                    <tr key={attempt.id} style={styles.tableRow}>
                      <td style={styles.td}>{attempt.quiz_title}</td>
                      <td style={styles.td}>{attempt.score}/{attempt.total_marks}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          background: attempt.score / attempt.total_marks >= 0.7 ? '#4CAF50' : '#f44336'
                        }}>
                          {Math.round((attempt.score / attempt.total_marks) * 100)}%
                        </span>
                      </td>
                      <td style={styles.td}>{Math.floor(attempt.time_taken / 60)}m {attempt.time_taken % 60}s</td>
                      <td style={styles.td}>{new Date(attempt.submitted_at).toLocaleDateString()}</td>
                      <td style={styles.td}>
                        <button
                          style={styles.smallBtn}
                          onClick={() => navigate(`/result/${attempt.id}`)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', background: '#f0f2f5' },
  loading: { textAlign: 'center', padding: '50px', fontSize: '18px', color: '#666' },
  header: {
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: 'white', padding: '15px 30px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  },
  logo: { margin: 0, fontSize: '24px' },
  userInfo: { display: 'flex', alignItems: 'center', gap: '15px' },
  welcome: { fontSize: '15px' },
  logoutBtn: {
    background: 'rgba(255,255,255,0.2)', color: 'white',
    border: '1px solid rgba(255,255,255,0.4)', padding: '7px 15px',
    borderRadius: '6px', cursor: 'pointer'
  },
  tabs: { background: 'white', padding: '0 30px', borderBottom: '2px solid #eee' },
  tab: {
    padding: '15px 20px', border: 'none', background: 'none',
    cursor: 'pointer', color: '#666', fontSize: '15px'
  },
  activeTab: {
    padding: '15px 20px', border: 'none', background: 'none',
    cursor: 'pointer', color: '#667eea', fontSize: '15px',
    borderBottom: '3px solid #667eea', fontWeight: '600'
  },
  content: { padding: '30px' },
  empty: { textAlign: 'center', padding: '50px', color: '#999', fontSize: '16px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  quizCard: {
    background: 'white', borderRadius: '12px', padding: '25px',
    boxShadow: '0 2px 15px rgba(0,0,0,0.08)'
  },
  quizTitle: { margin: '0 0 8px', color: '#333', fontSize: '18px' },
  quizDesc: { color: '#666', fontSize: '14px', marginBottom: '15px' },
  quizMeta: { display: 'flex', gap: '15px', color: '#888', fontSize: '13px', marginBottom: '18px' },
  startBtn: {
    width: '100%', padding: '12px', background: '#667eea', color: 'white',
    border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: '600'
  },
  viewBtn: {
    padding: '8px 16px', background: '#4CAF50', color: 'white',
    border: 'none', borderRadius: '6px', cursor: 'pointer', marginRight: '8px'
  },
  leaderBtn: {
    padding: '8px 16px', background: '#FF9800', color: 'white',
    border: 'none', borderRadius: '6px', cursor: 'pointer'
  },
  scoreDisplay: {
    background: '#f0f7ff', padding: '10px', borderRadius: '6px',
    marginBottom: '12px', color: '#333', fontWeight: '600', textAlign: 'center'
  },
  table: { width: '100%', background: 'white', borderRadius: '12px', borderCollapse: 'collapse', overflow: 'hidden' },
  tableHeader: { background: '#667eea' },
  th: { padding: '14px 16px', color: 'white', textAlign: 'left', fontSize: '14px' },
  tableRow: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '13px 16px', fontSize: '14px', color: '#333' },
  badge: { padding: '4px 10px', borderRadius: '20px', color: 'white', fontSize: '13px', fontWeight: '600' },
  smallBtn: {
    padding: '6px 14px', background: '#667eea', color: 'white',
    border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '13px'
  }
};

export default Dashboard;
