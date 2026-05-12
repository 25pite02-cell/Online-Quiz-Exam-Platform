// frontend/src/pages/Leaderboard.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLeaderboard } from '../api';
import { useAuth } from '../context/AuthContext';

const Leaderboard = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await getLeaderboard(quizId);
        setLeaderboard(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [quizId]);

  const getMedal = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  if (loading) return <div style={styles.loading}>Loading leaderboard...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>🏆 Leaderboard</h1>
          <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
        </div>

        {leaderboard.length === 0 ? (
          <p style={styles.empty}>No submissions yet. Be the first!</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>Rank</th>
                <th style={styles.th}>Player</th>
                <th style={styles.th}>Best Score</th>
                <th style={styles.th}>Percentage</th>
                <th style={styles.th}>Best Time</th>
                <th style={styles.th}>Attempts</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, index) => {
                const rank = index + 1;
                const isMe = entry.username === user?.username;
                return (
                  <tr
                    key={index}
                    style={{
                      ...styles.row,
                      background: isMe ? '#fff8e1' : rank <= 3 ? '#f9f9f9' : 'white'
                    }}
                  >
                    <td style={{ ...styles.td, fontSize: '20px', textAlign: 'center' }}>
                      {getMedal(rank)}
                    </td>
                    <td style={styles.td}>
                      <strong style={{ color: isMe ? '#FF9800' : '#333' }}>
                        {entry.username} {isMe ? '(You)' : ''}
                      </strong>
                    </td>
                    <td style={styles.td}>
                      {entry.best_score}/{entry.total_marks}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        background: entry.percentage >= 70 ? '#4CAF50' : entry.percentage >= 50 ? '#FF9800' : '#f44336'
                      }}>
                        {entry.percentage}%
                      </span>
                    </td>
                    <td style={styles.td}>
                      {Math.floor(entry.best_time / 60)}m {entry.best_time % 60}s
                    </td>
                    <td style={styles.td}>{entry.attempts_count}</td>
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
  container: { minHeight: '100vh', background: '#f0f2f5', padding: '30px 20px' },
  loading: { textAlign: 'center', padding: '80px', fontSize: '18px', color: '#666' },
  card: { maxWidth: '750px', margin: '0 auto', background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 30px rgba(0,0,0,0.1)' },
  header: { background: 'linear-gradient(135deg, #FF9800, #f44336)', padding: '25px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { margin: 0, color: 'white', fontSize: '26px' },
  backBtn: { padding: '8px 18px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '7px', cursor: 'pointer' },
  empty: { textAlign: 'center', padding: '50px', color: '#999' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f5f5f5' },
  th: { padding: '14px 16px', textAlign: 'left', color: '#555', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },
  row: { borderBottom: '1px solid #f0f0f0', transition: 'background 0.2s' },
  td: { padding: '14px 16px', fontSize: '15px', color: '#333' },
  badge: { padding: '4px 10px', borderRadius: '20px', color: 'white', fontSize: '13px', fontWeight: '700' }
};

export default Leaderboard;
