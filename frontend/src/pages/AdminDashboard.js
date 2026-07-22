// frontend/src/pages/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllQuizzes, deleteQuiz, getAllAttempts, getAllUsers, updateUserRole, getAttemptResult } from '../api';
import { useAuth } from '../context/AuthContext';

const isStudentEmail = (email) => /^\d/.test(email || '');

const AdminDashboard = () => {
  const [quizzes, setQuizzes]           = useState([]);
  const [attempts, setAttempts]         = useState([]);
  const [users, setUsers]               = useState([]);
  const [activeTab, setActiveTab]       = useState('quizzes');
  const [loading, setLoading]           = useState(true);
  const [expandedAttempt, setExpandedAttempt] = useState(null);
  const [attemptResult, setAttemptResult]     = useState(null);
  const [resultLoading, setResultLoading]     = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [qRes, aRes, uRes] = await Promise.all([getAllQuizzes(), getAllAttempts(), getAllUsers()]);
      setQuizzes(qRes.data);
      setAttempts(aRes.data);
      setUsers(uRes.data);
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
      setQuizzes(quizzes.filter(q => q.id !== quizId));
      alert('Quiz deleted!');
    } catch (err) { alert('Failed to delete quiz.'); }
  };

  const handleRoleChange = async (userId, currentRole, username) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const action  = newRole === 'admin' ? 'Make' : 'Remove';
    if (!window.confirm(`${action} "${username}" ${newRole === 'admin' ? 'an Admin' : 'a regular User'}?`)) return;
    try {
      await updateUserRole(userId, newRole);
      setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
      alert('Role updated!');
    } catch (err) { alert('Failed to update role.'); }
  };

  // ── Click on an attempt row to view color-coded answer review ──
  const handleAttemptClick = async (attemptId) => {
    if (expandedAttempt === attemptId) {
      // collapse
      setExpandedAttempt(null);
      setAttemptResult(null);
      return;
    }
    setExpandedAttempt(attemptId);
    setAttemptResult(null);
    setResultLoading(true);
    try {
      const res = await getAttemptResult(attemptId);
      setAttemptResult(res.data);
    } catch (err) {
      console.error(err);
      setAttemptResult(null);
    } finally {
      setResultLoading(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  if (loading) return <div style={styles.loading}>Loading admin panel...</div>;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.logo}>🎯 QuizApp Admin</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={styles.adminBadge}>👑 Admin: {user?.username}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Stats */}
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

      {/* Tabs */}
      <div style={styles.tabs}>
        <button style={activeTab === 'quizzes'  ? styles.activeTab : styles.tab} onClick={() => setActiveTab('quizzes')}>📚 Manage Quizzes</button>
        <button style={activeTab === 'attempts' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('attempts')}>📊 All Attempts</button>
        <button style={activeTab === 'users'    ? styles.activeTab : styles.tab} onClick={() => setActiveTab('users')}>👥 Manage Users</button>
      </div>

      <div style={styles.content}>

        {/* ── Manage Quizzes ── */}
        {activeTab === 'quizzes' && (
          <div>
            <button style={styles.createBtn} onClick={() => navigate('/admin/create-quiz')}>+ Create New Quiz</button>
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
                  <tr key={quiz.id} style={styles.row}>
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
                      <button style={styles.editBtn}   onClick={() => navigate(`/admin/edit-quiz/${quiz.id}`)}>Edit</button>
                      <button style={styles.deleteBtn} onClick={() => handleDelete(quiz.id)}>Delete</button>
                      <button style={styles.viewBtn}   onClick={() => navigate(`/leaderboard/${quiz.id}`)}>🏆</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── All Attempts (with color-coded answer review) ── */}
        {activeTab === 'attempts' && (
          <div>
            <p style={{ color: '#666', marginBottom: '12px', fontSize: '13px' }}>
              💡 Click on any row to view the student's answer review with color coding.
            </p>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>User</th>
                  <th style={styles.th}>Quiz</th>
                  <th style={styles.th}>Score</th>
                  <th style={styles.th}>Percentage</th>
                  <th style={styles.th}>Warnings</th>
                  <th style={styles.th}>Time</th>
                  <th style={styles.th}>Date</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map(attempt => (
                  <React.Fragment key={attempt.id}>
                    {/* ── Attempt row ── */}
                    <tr
                      style={{
                        ...styles.row,
                        cursor: 'pointer',
                        background: expandedAttempt === attempt.id ? '#f0f4ff' : 'white',
                      }}
                      onClick={() => handleAttemptClick(attempt.id)}
                    >
                      <td style={styles.td}>
                        <span style={{ marginRight: 6 }}>
                          {expandedAttempt === attempt.id ? '▾' : '▸'}
                        </span>
                        {attempt.username}
                      </td>
                      <td style={styles.td}>{attempt.quiz_title}</td>
                      <td style={styles.td}>{attempt.score}/{attempt.total_marks}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          background: (attempt.score / attempt.total_marks) >= 0.6 ? '#4CAF50' : '#f44336'
                        }}>
                          {Math.round((attempt.score / attempt.total_marks) * 100)}%
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          background: attempt.warnings >= 3 ? '#f44336' : attempt.warnings > 0 ? '#FF9800' : '#4CAF50'
                        }}>
                          {attempt.warnings || 0}
                        </span>
                      </td>
                      <td style={styles.td}>{Math.floor(attempt.time_taken / 60)}m {attempt.time_taken % 60}s</td>
                      <td style={styles.td}>{new Date(attempt.submitted_at).toLocaleString()}</td>
                    </tr>

                    {/* ── Expanded answer review ── */}
                    {expandedAttempt === attempt.id && (
                      <tr>
                        <td colSpan={7} style={{ padding: '0', background: '#f8f9ff' }}>
                          <div style={styles.reviewBox}>
                            {resultLoading && (
                              <div style={styles.reviewLoading}>Loading answer review...</div>
                            )}
                            {!resultLoading && !attemptResult && (
                              <div style={{ color: '#f44336', padding: '16px' }}>
                                Could not load answer review for this attempt.
                              </div>
                            )}
                            {!resultLoading && attemptResult && (
                              <>
                                {/* Legend */}
                                <div style={styles.legend}>
                                  <span style={styles.legendItem}>
                                    <span style={{ ...styles.dot, background: '#4CAF50' }} /> Correct
                                  </span>
                                  <span style={styles.legendItem}>
                                    <span style={{ ...styles.dot, background: '#f44336' }} /> Wrong
                                  </span>
                                  <span style={styles.legendItem}>
                                    <span style={{ ...styles.dot, background: '#9e9e9e' }} /> Not Answered
                                  </span>
                                </div>

                                {/* Questions */}
                                {attemptResult.answers.map((ans, idx) => {
                                  const notAnswered = !ans.selected_answer;
                                  const borderColor = notAnswered
                                    ? '#9e9e9e'
                                    : ans.is_correct ? '#4CAF50' : '#f44336';

                                  const optionLabels = {
                                    A: ans.option_a,
                                    B: ans.option_b,
                                    C: ans.option_c,
                                    D: ans.option_d,
                                  };

                                  return (
                                    <div key={idx} style={{ ...styles.questionCard, borderLeft: `5px solid ${borderColor}` }}>
                                      {/* Question header */}
                                      <div style={styles.questionHeader}>
                                        <span style={styles.qNum}>Q{idx + 1}</span>
                                        <span style={styles.questionText}>{ans.question_text}</span>
                                        <span style={{
                                          ...styles.statusBadge,
                                          background: notAnswered ? '#9e9e9e' : ans.is_correct ? '#4CAF50' : '#f44336'
                                        }}>
                                          {notAnswered ? 'Not Answered' : ans.is_correct ? '✓ Correct' : '✗ Wrong'}
                                        </span>
                                      </div>

                                      {/* Options */}
                                      <div style={styles.optionsGrid}>
                                        {['A', 'B', 'C', 'D'].map(letter => {
                                          const isCorrect  = letter === ans.correct_answer;
                                          const isSelected = letter === ans.selected_answer;

                                          let bg      = '#f5f5f5';
                                          let color   = '#333';
                                          let border  = '1px solid #e0e0e0';
                                          let icon    = '';

                                          if (isCorrect && isSelected) {
                                            // student selected correct answer — green
                                            bg = '#e8f5e9'; color = '#1b5e20'; border = '2px solid #4CAF50'; icon = ' ✓';
                                          } else if (isCorrect && !isSelected) {
                                            // correct answer but student didn't pick — light green outline
                                            bg = '#f1f8f1'; color = '#2e7d32'; border = '2px solid #81c784'; icon = ' ✓';
                                          } else if (!isCorrect && isSelected) {
                                            // student selected wrong — red
                                            bg = '#ffebee'; color = '#b71c1c'; border = '2px solid #f44336'; icon = ' ✗';
                                          }

                                          return (
                                            <div key={letter} style={{ ...styles.optionBox, background: bg, color, border }}>
                                              <span style={styles.optionLetter}>{letter}</span>
                                              <span>{optionLabels[letter]}{icon}</span>
                                            </div>
                                          );
                                        })}
                                      </div>

                                      {/* Answer summary */}
                                      <div style={styles.answerSummary}>
                                        <span>
                                          <strong>Student answered:</strong>{' '}
                                          {ans.selected_answer
                                            ? <span style={{ color: ans.is_correct ? '#4CAF50' : '#f44336', fontWeight: 700 }}>
                                                {ans.selected_answer} — {optionLabels[ans.selected_answer]}
                                              </span>
                                            : <span style={{ color: '#9e9e9e' }}>Not answered</span>
                                          }
                                        </span>
                                        <span style={{ marginLeft: 24 }}>
                                          <strong>Correct answer:</strong>{' '}
                                          <span style={{ color: '#2e7d32', fontWeight: 700 }}>
                                            {ans.correct_answer} — {optionLabels[ans.correct_answer]}
                                          </span>
                                        </span>
                                        <span style={{ marginLeft: 24, color: '#666' }}>
                                          Marks: {ans.is_correct ? `+${ans.marks}` : '0'} / {ans.marks}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Manage Users ── */}
        {activeTab === 'users' && (
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>Username</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const student = isStudentEmail(u.email);
                return (
                  <tr key={u._id} style={styles.row}>
                    <td style={styles.td}><strong>{u.username}</strong></td>
                    <td style={styles.td}>{u.email}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, background: student ? '#94a3b8' : '#38bdf8' }}>
                        {student ? '🎓 Student' : '🧑‍🏫 Staff'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, background: u.role === 'admin' ? '#ffd700' : '#ccc', color: u.role === 'admin' ? '#333' : 'white' }}>
                        {u.role === 'admin' ? '👑 Admin' : 'User'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {student && u.role !== 'admin' ? (
                        <span style={{ color: '#999', fontSize: '13px' }}>Student account — cannot be made Admin</span>
                      ) : (
                        <button
                          style={u.role === 'admin' ? styles.deleteBtn : styles.editBtn}
                          onClick={() => handleRoleChange(u._id, u.role, u.username)}
                        >
                          {u.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const styles = {
  container:     { minHeight: '100vh', background: '#f0f2f5' },
  loading:       { textAlign: 'center', padding: '80px', fontSize: '18px', color: '#666' },
  header:        { background: 'linear-gradient(135deg, #1a1a2e, #16213e)', color: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logo:          { margin: 0, fontSize: '22px' },
  adminBadge:    { background: 'rgba(255,215,0,0.2)', border: '1px solid rgba(255,215,0,0.4)', padding: '6px 14px', borderRadius: '20px', color: '#ffd700', fontSize: '14px' },
  logoutBtn:     { background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', padding: '7px 15px', borderRadius: '6px', cursor: 'pointer' },
  stats:         { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', padding: '25px 30px' },
  statCard:      { background: 'white', borderRadius: '10px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' },
  statNum:       { fontSize: '36px', fontWeight: '800', color: '#667eea' },
  statLabel:     { color: '#888', fontSize: '13px', marginTop: '4px' },
  tabs:          { background: 'white', padding: '0 30px', borderBottom: '2px solid #eee' },
  tab:           { padding: '14px 20px', border: 'none', background: 'none', cursor: 'pointer', color: '#666', fontSize: '15px' },
  activeTab:     { padding: '14px 20px', border: 'none', background: 'none', cursor: 'pointer', color: '#667eea', fontSize: '15px', borderBottom: '3px solid #667eea', fontWeight: '600' },
  content:       { padding: '25px 30px' },
  createBtn:     { background: '#4CAF50', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: '600', marginBottom: '20px' },
  table:         { width: '100%', background: 'white', borderCollapse: 'collapse', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' },
  thead:         { background: '#1a1a2e' },
  th:            { padding: '13px 16px', color: 'white', textAlign: 'left', fontSize: '13px' },
  row:           { borderBottom: '1px solid #f0f0f0' },
  td:            { padding: '13px 16px', fontSize: '14px', color: '#333' },
  badge:         { padding: '4px 10px', borderRadius: '20px', color: 'white', fontSize: '12px', fontWeight: '600' },
  editBtn:       { padding: '5px 12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '6px', fontSize: '13px' },
  deleteBtn:     { padding: '5px 12px', background: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '6px', fontSize: '13px' },
  viewBtn:       { padding: '5px 12px', background: '#FF9800', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '13px' },

  // Answer review styles
  reviewBox:     { padding: '20px 24px', borderTop: '1px solid #dde' },
  reviewLoading: { color: '#667eea', padding: '16px', textAlign: 'center' },
  legend:        { display: 'flex', gap: '20px', marginBottom: '16px', fontSize: '13px', color: '#555' },
  legendItem:    { display: 'flex', alignItems: 'center', gap: '6px' },
  dot:           { display: 'inline-block', width: 12, height: 12, borderRadius: '50%' },

  questionCard:  { background: 'white', borderRadius: '10px', padding: '16px 20px', marginBottom: '14px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' },
  questionHeader:{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' },
  qNum:          { background: '#667eea', color: 'white', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px', flexShrink: 0 },
  questionText:  { flex: 1, fontWeight: '600', color: '#333', fontSize: '15px', lineHeight: 1.5 },
  statusBadge:   { color: 'white', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap' },

  optionsGrid:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' },
  optionBox:     { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', fontSize: '14px' },
  optionLetter:  { fontWeight: '700', minWidth: '22px' },
  answerSummary: { fontSize: '13px', color: '#555', paddingTop: '10px', borderTop: '1px solid #eee', display: 'flex', flexWrap: 'wrap', gap: '6px' },
};

export default AdminDashboard;
