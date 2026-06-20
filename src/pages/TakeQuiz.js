// frontend/src/pages/TakeQuiz.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuizById, startAttempt, submitAttempt } from '../api';

const TakeQuiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async (isAutoSubmit = false) => {
    if (submitting) return;
    setSubmitting(true);

    const answersArray = Object.keys(answers).map(qId => ({
      question_id: qId,
      selected_answer: answers[qId]
    }));

    try {
      const res = await submitAttempt(attemptId, answersArray);
      if (isAutoSubmit) alert('⏰ Time is up! Your answers have been submitted.');
      navigate(`/result/${attemptId}`, { state: res.data });
    } catch (err) {
      console.error(err);
      setError('Failed to submit. Please try again.');
      setSubmitting(false);
    }
  }, [answers, attemptId, navigate, submitting]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, handleSubmit]);

  useEffect(() => {
    const init = async () => {
      try {
        const [quizRes, attemptRes] = await Promise.all([
          getQuizById(id),
          startAttempt(id)
        ]);
        setQuiz(quizRes.data);
        setAttemptId(attemptRes.data.attemptId);
        setTimeLeft(quizRes.data.time_limit * 60);
      } catch (err) {
        setError('Failed to load quiz.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id]);

  const handleAnswerSelect = (questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeLeft < 60) return '#f44336';
    if (timeLeft < 300) return '#FF9800';
    return '#4CAF50';
  };

  if (loading) return <div style={styles.loading}>Loading quiz...</div>;
  if (error) return <div style={styles.loading} onClick={() => navigate('/dashboard')}>{error} Click to go back.</div>;
  if (!quiz) return null;

  const question = quiz.questions[currentQuestion];
  const options = ['A', 'B', 'C', 'D'];
  const optionTexts = {
    A: question.option_a,
    B: question.option_b,
    C: question.option_c,
    D: question.option_d
  };
  const answeredCount = Object.keys(answers).length;

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <div style={styles.quizName}>{quiz.title}</div>
        <div style={{ ...styles.timer, color: getTimerColor() }}>
          ⏱ {formatTime(timeLeft)}
        </div>
        <div style={styles.progress}>
          {answeredCount}/{quiz.questions.length} answered
        </div>
      </div>

      <div style={styles.body}>
        <div style={styles.sidebar}>
          <h4 style={styles.navTitle}>Questions</h4>
          <div style={styles.navGrid}>
            {quiz.questions.map((q, index) => (
              <button
                key={q._id}
                style={{
                  ...styles.navBtn,
                  background: answers[q._id]
                    ? '#4CAF50'
                    : index === currentQuestion ? '#667eea' : '#e0e0e0',
                  color: answers[q._id] || index === currentQuestion ? 'white' : '#333'
                }}
                onClick={() => setCurrentQuestion(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <div style={styles.legend}>
            <span style={styles.legendItem}><span style={{ ...styles.dot, background: '#4CAF50' }} /> Answered</span>
            <span style={styles.legendItem}><span style={{ ...styles.dot, background: '#667eea' }} /> Current</span>
            <span style={styles.legendItem}><span style={{ ...styles.dot, background: '#e0e0e0' }} /> Not answered</span>
          </div>
        </div>

        <div style={styles.main}>
          <div style={styles.questionCard}>
            <div style={styles.qNumber}>Question {currentQuestion + 1} of {quiz.questions.length}</div>
            <p style={styles.questionText}>{question.question_text}</p>

            <div style={styles.options}>
              {options.map(opt => (
                <div
                  key={opt}
                  style={{
                    ...styles.option,
                    ...(answers[question._id] === opt ? styles.selectedOption : {})
                  }}
                  onClick={() => handleAnswerSelect(question._id, opt)}
                >
                  <span style={styles.optLabel}>{opt}</span>
                  <span>{optionTexts[opt]}</span>
                </div>
              ))}
            </div>

            <div style={styles.nav}>
              <button
                style={styles.navButton}
                onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
              >
                ← Previous
              </button>

              {currentQuestion < quiz.questions.length - 1 ? (
                <button
                  style={styles.nextButton}
                  onClick={() => setCurrentQuestion(prev => prev + 1)}
                >
                  Next →
                </button>
              ) : (
                <button
                  style={styles.submitButton}
                  onClick={() => {
                    if (window.confirm(`Submit quiz? You've answered ${answeredCount}/${quiz.questions.length} questions.`)) {
                      handleSubmit();
                    }
                  }}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : '✔ Submit Quiz'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', background: '#f0f2f5', display: 'flex', flexDirection: 'column' },
  loading: { textAlign: 'center', padding: '80px', fontSize: '18px', color: '#666', cursor: 'pointer' },
  topBar: {
    background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white',
    padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  },
  quizName: { fontSize: '18px', fontWeight: '600' },
  timer: { fontSize: '28px', fontWeight: '800', background: 'rgba(255,255,255,0.15)', padding: '5px 20px', borderRadius: '8px' },
  progress: { fontSize: '15px' },
  body: { display: 'flex', flex: 1, padding: '25px', gap: '20px' },
  sidebar: {
    width: '220px', background: 'white', borderRadius: '12px',
    padding: '20px', boxShadow: '0 2px 15px rgba(0,0,0,0.08)', alignSelf: 'flex-start'
  },
  navTitle: { margin: '0 0 15px', color: '#333' },
  navGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '7px' },
  navBtn: { width: '35px', height: '35px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  legend: { marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#666' },
  dot: { width: '12px', height: '12px', borderRadius: '50%', display: 'inline-block' },
  main: { flex: 1 },
  questionCard: {
    background: 'white', borderRadius: '12px',
    padding: '30px', boxShadow: '0 2px 15px rgba(0,0,0,0.08)'
  },
  qNumber: { color: '#888', fontSize: '14px', marginBottom: '12px', fontWeight: '600' },
  questionText: { fontSize: '18px', color: '#333', lineHeight: '1.6', marginBottom: '25px' },
  options: { display: 'flex', flexDirection: 'column', gap: '12px' },
  option: {
    display: 'flex', alignItems: 'center', gap: '15px', padding: '16px 20px',
    border: '2px solid #e0e0e0', borderRadius: '10px', cursor: 'pointer',
    fontSize: '15px', color: '#333', transition: 'all 0.2s'
  },
  selectedOption: { border: '2px solid #667eea', background: '#f0f3ff' },
  optLabel: {
    width: '32px', height: '32px', background: '#667eea', color: 'white',
    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: '700', flexShrink: 0
  },
  nav: { display: 'flex', justifyContent: 'space-between', marginTop: '30px' },
  navButton: {
    padding: '11px 22px', background: '#e0e0e0', color: '#333',
    border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px'
  },
  nextButton: {
    padding: '11px 22px', background: '#667eea', color: 'white',
    border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600'
  },
  submitButton: {
    padding: '11px 22px', background: '#4CAF50', color: 'white',
    border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600'
  }
};

export default TakeQuiz;
