// frontend/src/pages/CreateQuiz.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createQuiz } from '../api';

// Empty question template
const emptyQuestion = () => ({
  question_text: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_answer: 'A',
  marks: 1
});

const CreateQuiz = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    time_limit: 30,
    randomize_questions: false
  });

  const [questions, setQuestions] = useState([emptyQuestion()]);

  const handleQuizChange = (e) => {
    const { name, value, type, checked } = e.target;
    setQuizData({ ...quizData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const addQuestion = () => {
    setQuestions([...questions, emptyQuestion()]);
  };

  const removeQuestion = (index) => {
    if (questions.length === 1) return alert('At least 1 question is required.');
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text || !q.option_a || !q.option_b || !q.option_c || !q.option_d) {
        setError(`Question ${i + 1} is incomplete. All fields are required.`);
        setLoading(false);
        return;
      }
    }

    try {
      await createQuiz({ ...quizData, questions });
      alert('Quiz created successfully!');
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create quiz.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>➕ Create New Quiz</h1>
        <button style={styles.backBtn} onClick={() => navigate('/admin')}>← Back</button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Quiz Info Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Quiz Information</h2>
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Quiz Title *</label>
              <input style={styles.input} name="title" placeholder="e.g. JavaScript Basics" value={quizData.title} onChange={handleQuizChange} required />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Time Limit (minutes) *</label>
              <input style={styles.input} type="number" name="time_limit" min="1" max="180" value={quizData.time_limit} onChange={handleQuizChange} required />
            </div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Description</label>
            <textarea style={styles.textarea} name="description" placeholder="Short description of the quiz" value={quizData.description} onChange={handleQuizChange} rows={3} />
          </div>
          <label style={styles.checkboxLabel}>
            <input type="checkbox" name="randomize_questions" checked={quizData.randomize_questions} onChange={handleQuizChange} />
            🔀 Randomize question order for each attempt
          </label>
        </div>

        {/* Questions Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Questions ({questions.length})</h2>
          {questions.map((q, index) => (
            <div key={index} style={styles.questionBlock}>
              <div style={styles.qHeader}>
                <h3 style={styles.qNum}>Question {index + 1}</h3>
                <button type="button" style={styles.removeBtn} onClick={() => removeQuestion(index)}>
                  ✕ Remove
                </button>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Question Text *</label>
                <textarea
                  style={styles.textarea}
                  placeholder="Enter your question here..."
                  value={q.question_text}
                  onChange={(e) => handleQuestionChange(index, 'question_text', e.target.value)}
                  rows={2}
                  required
                />
              </div>

              <div style={styles.optionsGrid}>
                {['A', 'B', 'C', 'D'].map(opt => (
                  <div key={opt} style={styles.optionField}>
                    <label style={styles.label}>Option {opt} *</label>
                    <input
                      style={styles.input}
                      placeholder={`Option ${opt}`}
                      value={q[`option_${opt.toLowerCase()}`]}
                      onChange={(e) => handleQuestionChange(index, `option_${opt.toLowerCase()}`, e.target.value)}
                      required
                    />
                  </div>
                ))}
              </div>

              <div style={styles.row}>
                <div style={styles.field}>
                  <label style={styles.label}>Correct Answer *</label>
                  <select
                    style={styles.select}
                    value={q.correct_answer}
                    onChange={(e) => handleQuestionChange(index, 'correct_answer', e.target.value)}
                  >
                    <option value="A">A - {q.option_a || '...'}</option>
                    <option value="B">B - {q.option_b || '...'}</option>
                    <option value="C">C - {q.option_c || '...'}</option>
                    <option value="D">D - {q.option_d || '...'}</option>
                  </select>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Marks</label>
                  <input
                    style={styles.input}
                    type="number"
                    min="1"
                    value={q.marks}
                    onChange={(e) => handleQuestionChange(index, 'marks', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>
          ))}

          <button type="button" style={styles.addBtn} onClick={addQuestion}>
            + Add Another Question
          </button>
        </div>

        <button type="submit" style={styles.submitBtn} disabled={loading}>
          {loading ? 'Creating Quiz...' : '✔ Create Quiz'}
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', background: '#f0f2f5', padding: '30px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
  title: { margin: 0, color: '#333' },
  backBtn: { padding: '9px 18px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  error: { background: '#ffe0e0', color: '#d00', padding: '12px 18px', borderRadius: '8px', marginBottom: '20px' },
  section: { background: 'white', borderRadius: '12px', padding: '25px', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' },
  sectionTitle: { margin: '0 0 20px', color: '#333', borderBottom: '2px solid #f0f0f0', paddingBottom: '10px' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  field: { marginBottom: '15px' },
  label: { display: 'block', marginBottom: '6px', color: '#555', fontWeight: '600', fontSize: '14px' },
  input: { width: '100%', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' },
  select: { width: '100%', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '15px', color: '#444' },
  questionBlock: { border: '2px solid #e8e8e8', borderRadius: '10px', padding: '20px', marginBottom: '18px' },
  qHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  qNum: { margin: 0, color: '#667eea' },
  removeBtn: { background: '#f44336', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '13px' },
  optionsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' },
  optionField: {},
  addBtn: { width: '100%', padding: '13px', background: '#e8f0fe', color: '#667eea', border: '2px dashed #667eea', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: '600' },
  submitBtn: { width: '100%', padding: '15px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '17px', fontWeight: '700', marginTop: '10px' }
};

export default CreateQuiz;
