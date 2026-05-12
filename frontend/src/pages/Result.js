// frontend/src/pages/Result.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getAttemptResult } from '../api';

const Result = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await getAttemptResult(id);
        setResult(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [id]);

  if (loading) return <div style={styles.loading}>Loading result...</div>;
  if (!result) return <div style={styles.loading}>Result not found.</div>;

  const percentage = Math.round((result.score / result.total_marks) * 100);
  const passed = percentage >= 60;
  const minutes = Math.floor(result.time_taken / 60);
  const seconds = result.time_taken % 60;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Result Header */}
        <div style={{ ...styles.header, background: passed ? '#4CAF50' : '#f44336' }}>
          <div style={styles.emoji}>{passed ? '🎉' : '😢'}</div>
          <h1 style={styles.resultTitle}>{passed ? 'Congratulations!' : 'Better Luck Next Time!'}</h1>
          <p style={styles.quizName}>{result.quiz_title}</p>
        </div>

        {/* Score Summary */}
        <div style={styles.scoreSummary}>
          <div style={styles.scoreBox}>
            <div style={styles.bigScore}>{result.score}/{result.total_marks}</div>
            <div style={styles.scoreLabel}>Score</div>
          </div>
          <div style={styles.scoreBox}>
            <div style={{ ...styles.bigScore, color: passed ? '#4CAF50' : '#f44336' }}>
              {percentage}%
            </div>
            <div style={styles.scoreLabel}>Percentage</div>
          </div>
          <div style={styles.scoreBox}>
            <div style={styles.bigScore}>{minutes}m {seconds}s</div>
            <div style={styles.scoreLabel}>Time Taken</div>
          </div>
          <div style={styles.scoreBox}>
            <div style={styles.bigScore}>
              {result.answers?.filter(a => a.is_correct).length}/{result.answers?.length}
            </div>
            <div style={styles.scoreLabel}>Correct</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={styles.actions}>
          <button style={styles.dashBtn} onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
          <button
            style={styles.leaderBtn}
            onClick={() => navigate(`/leaderboard/${result.quiz_id}`)}
          >
            🏆 View Leaderboard
          </button>
        </div>

        {/* Detailed Answers Review */}
        <h2 style={styles.reviewTitle}>Answer Review</h2>
        <div style={styles.answerList}>
          {result.answers?.map((answer, index) => (
            <div
              key={index}
              style={{
                ...styles.answerCard,
                borderLeft: `4px solid ${answer.is_correct ? '#4CAF50' : '#f44336'}`
              }}
            >
              <div style={styles.qHeader}>
                <span style={styles.qNum}>Q{index + 1}</span>
                <span style={{ color: answer.is_correct ? '#4CAF50' : '#f44336', fontWeight: '600' }}>
                  {answer.is_correct ? '✓ Correct' : '✗ Wrong'} ({answer.marks} mark)
                </span>
              </div>
              <p style={styles.qText}>{answer.question_text}</p>

              {/* Show all options */}
              {['A', 'B', 'C', 'D'].map(opt => {
                const optText = answer[`option_${opt.toLowerCase()}`];
                const isCorrect = opt === answer.correct_answer;
                const isSelected = opt === answer.selected_answer;
                return (
                  <div key={opt} style={{
                    ...styles.optionReview,
                    background: isCorrect ? '#e8f5e9' : isSelected ? '#ffebee' : '#fafafa',
                    border: `1px solid ${isCorrect ? '#81c784' : isSelected ? '#e57373' : '#eee'}`
                  }}>
                    <strong>{opt}.</strong> {optText}
                    {isCorrect && <span style={{ color: '#4CAF50', marginLeft: '8px' }}>✓ Correct Answer</span>}
                    {isSelected && !isCorrect && <span style={{ color: '#f44336', marginLeft: '8px' }}>✗ Your Answer</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', background: '#f0f2f5', padding: '30px 20px' },
  loading: { textAlign: 'center', padding: '80px', fontSize: '18px', color: '#666' },
  card: { maxWidth: '800px', margin: '0 auto', background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 30px rgba(0,0,0,0.1)' },
  header: { padding: '40px', textAlign: 'center', color: 'white' },
  emoji: { fontSize: '60px', marginBottom: '10px' },
  resultTitle: { margin: '0 0 8px', fontSize: '32px' },
  quizName: { margin: 0, opacity: 0.85, fontSize: '16px' },
  scoreSummary: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', padding: '25px', gap: '10px', borderBottom: '1px solid #eee' },
  scoreBox: { textAlign: 'center', padding: '15px' },
  bigScore: { fontSize: '28px', fontWeight: '800', color: '#333' },
  scoreLabel: { color: '#888', fontSize: '13px', marginTop: '5px' },
  actions: { display: 'flex', gap: '15px', padding: '20px 25px', borderBottom: '1px solid #eee' },
  dashBtn: { padding: '10px 20px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  leaderBtn: { padding: '10px 20px', background: '#FF9800', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  reviewTitle: { padding: '20px 25px 0', color: '#333' },
  answerList: { padding: '10px 25px 30px' },
  answerCard: { marginBottom: '20px', padding: '18px', background: '#fafafa', borderRadius: '8px' },
  qHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
  qNum: { background: '#667eea', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700' },
  qText: { margin: '0 0 12px', color: '#333', fontSize: '15px', lineHeight: '1.5' },
  optionReview: { padding: '8px 12px', borderRadius: '6px', marginBottom: '6px', fontSize: '14px' }
};

export default Result;
