import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllQuizzes, deleteQuiz, getAllAttempts } from '../api';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [activeTab, setActiveTab] = useState('quizzes');
  const [loading, setLoading] = useState(true);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [qRes, aRes] = await Promise.all([getAllQuizzes(), getAllAttempts()]);
      setQuizzes(qRes.data);
      setAttempts(aRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (quizId) => {
    if (!window.confirm('Delete this quiz? All attempts will also be deleted.')) return;
    try {
      await deleteQuiz(quizId);
      setQuizzes(quizzes.filter(q => q._id !== quizId));
      alert('Quiz deleted!');
    } catch (err) {
      alert('Failed to delete quiz.');
    }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  if (loading) return <div style={styles.loading}>Loading admin panel...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.logo}>🎯 QuizApp Admin</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={styles.adminBadge}>👑 Admin: {user?.username}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div style={styles.stats}>
        <div style={styles.statCard}>
          <div style={styles.statNum}>{quizzes.length}</div>
          <div style={styles.statLabel}>Total Quizzes</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNum}>{quizzes.filter(q => q.is_active).length}</div>
          <div style={styles.statLabel}>Active Quizzes</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNum}>{attempts.length}</div>
          <div style={styles.statLabel}>Total Attempts</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNum}>
            {attempts.length > 0
              ? Math.round(attempts.reduce((a, b) => a + (b.score / b.total_marks * 100), 0) / attempts.length)
              : 0}%
          </div>
          <div style={styles.statLabel}>Avg Score</div>
        </div>
      </div>

      <div style={styles.tabs}>
        <button style={activeTab === 'quizzes' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('quizzes')}>
          📚 Manage Quizzes
        </button>
        <button style={activeTab === 'attempts' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('attempts')}>
          📊 All Attempts
        </button>
      </div>

      <div style={styles.content}>
        {activeTab === 'quizzes' && (
          <div>
            <button style={styles.createBtn} onClick={() => navigate('/admin/create-quiz')}>
              + Create New Quiz
            </button>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>Title</th>
                  <th style={styles.th}>Questions</th>
                  <th style={styles.th}>Time Limit</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Randomize</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map(quiz => (
                  <tr key={quiz._id} style={styles.row}>
                    <td style={styles.td}><strong>{quiz.title}</strong></td>
                    <td style={styles.td}>{quiz.total_questions}</td>
                    <td style={styles.td}>{quiz.time_limit} min</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, background: quiz.is_active ? '#4CAF50' : '#ccc' }}>
                        {quiz.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={styles.td}>{quiz.randomize_questions ? '✅' : '❌'}</td>
                    <td style={styles.td}>
                      <button style={styles.editBtn} onClick={() => navigate(`/admin/edit-quiz/${quiz._id}`)}>Edit</button>
                      <button style={styles.deleteBtn} onClick={() => handleDelete(quiz._id)}>Delete</button>
                      <button style={styles.viewBtn} onClick={() => navigate(`/leaderboard/${quiz._id}`)}>🏆</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'attempts' && (
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>User</th>
                <th style={styles.th}>Quiz</th>
                <th style={styles.th}>Score</th>
                <th style={styles.th}>Percentage</th>
                <th style={styles.th}>Time</th>
                <th style={styles.th}>Date</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map(attempt => (
                <tr key={attempt._id} style={styles.row}>
                  <td style={styles.td}>{attempt.user_id?.username}</td>
                  <td style={styles.td}>{attempt.quiz_id?.title}</td>
                  <td style={styles.td}>{attempt.score}/{attempt.total_marks}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      background: (attempt.score / attempt.total_marks) >= 0.6 ? '#4CAF50' : '#f44336'
                    }}>
                      {Math.round((attempt.score / attempt.total_marks) * 100)}%
                    </span>
                  </td>
                  <td style={styles.td}>{Math.floor(attempt.time_taken / 60)}m {attempt.time_taken % 60}s</td>
                  <td style={styles.td}>{new Date(attempt.submitted_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', background: '#f0f2f5' },
  loading: { textAlign: 'center', padding: '80px', fontSize: '18px', color: '#666' },
  header: { background: 'linear-gradient(135deg, #1a1a2e, #16213e)', color: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logo: { margin: 0, fontSize: '22px' },
  adminBadge: { background: 'rgba(255,215,0,0.2)', border: '1px solid rgba(255,215,0,0.4)', padding: '6px 14px', borderRadius: '20px', color: '#ffd700', fontSize: '14px' },
  logoutBtn: { background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', padding: '7px 15px', borderRadius: '6px', cursor: 'pointer' },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', padding: '25px 30px' },
  statCard: { background: 'white', borderRadius: '10px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' },
  statNum: { fontSize: '36px', fontWeight: '800', color: '#667eea' },
  statLabel: { color: '#888', fontSize: '13px', marginTop: '4px' },
  tabs: { background: 'white', padding: '0 30px', borderBottom: '2px solid #eee' },
  tab: { padding: '14px 20px', border: 'none', background: 'none', cursor: 'pointer', color: '#666', fontSize: '15px' },
  activeTab: { padding: '14px 20px', border: 'none', background: 'none', cursor: 'pointer', color: '#667eea', fontSize: '15px', borderBottom: '3px solid #667eea', fontWeight: '600' },
  content: { padding: '25px 30px' },
  createBtn: { background: '#4CAF50', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: '600', marginBottom: '20px' },
  table: { width: '100%', background: 'white', borderCollapse: 'collapse', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' },
  thead: { background: '#1a1a2e' },
  th: { padding: '13px 16px', color: 'white', textAlign: 'left', fontSize: '13px' },
  row: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '13px 16px', fontSize: '14px', color: '#333' },
  badge: { padding: '4px 10px', borderRadius: '20px', color: 'white', fontSize: '12px', fontWeight: '600' },
  editBtn: { padding: '5px 12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '6px', fontSize: '13px' },
  deleteBtn: { padding: '5px 12px', background: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '6px', fontSize: '13px' },
  viewBtn: { padding: '5px 12px', background: '#FF9800', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '13px' }
};

export default AdminDashboard;
