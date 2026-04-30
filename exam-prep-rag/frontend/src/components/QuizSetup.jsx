import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function QuizSetup({ onStart }) {
  const { documents, selectedDocIds } = useApp();
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [numQuestions, setNumQuestions] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Determine which doc IDs to send — empty selectedDocIds means "all" in header logic
  const effectiveDocIds = selectedDocIds.length === 0
    ? documents.map(d => d.id)
    : selectedDocIds;

  // Build a label showing which documents will be used
  const docLabel = selectedDocIds.length === 0
    ? `All Documents (${documents.length})`
    : selectedDocIds.length === 1
      ? documents.find(d => d.id === selectedDocIds[0])?.name || '1 document'
      : `${selectedDocIds.length} of ${documents.length} documents`;

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (documents.length === 0) {
      setError('No documents uploaded. Please upload a document first.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/quiz/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('ep_token')}`
        },
        body: JSON.stringify({
          topic: topic.trim() || undefined,
          difficulty,
          num_questions: numQuestions,
          doc_ids: effectiveDocIds
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate quiz');
      }

      const generatedQuiz = await response.json();
      onStart(generatedQuiz);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="quiz-setup">
      <div className="quiz-setup-card">
        <div className="quiz-header">
          <div className="quiz-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </div>
          <h2>Create a New Quiz</h2>
          <p>Customize your quiz settings below.</p>
        </div>

        {error && (
          <div className="quiz-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        <form className="quiz-form" onSubmit={handleGenerate}>
          {/* Show which documents will be used (read-only info from header selector) */}
          <div className="quiz-field">
            <label>Source Documents</label>
            {documents.length === 0 ? (
              <div className="quiz-no-docs-alert">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <span>No documents uploaded. Please upload a document using the <strong>+ Upload</strong> button in the header to generate a quiz.</span>
              </div>
            ) : (
              <div className="quiz-doc-info">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
                <span>{docLabel}</span>
              </div>
            )}
            <span className="quiz-help">Change document selection from the dropdown in the top header bar.</span>
          </div>

          <div className="quiz-field">
            <label htmlFor="topic">Topic Focus (Optional)</label>
            <input 
              id="topic" 
              type="text" 
              placeholder="e.g. Thermodynamics, Machine Learning..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <span className="quiz-help">Leave blank for a general quiz across the selected documents.</span>
          </div>

          <div className="quiz-row">
            <div className="quiz-field">
              <label htmlFor="difficulty">Difficulty</label>
              <select id="difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="Easy">Easy (Fact Recall)</option>
                <option value="Medium">Medium (Conceptual)</option>
                <option value="Hard">Hard (Application)</option>
              </select>
            </div>
            
            <div className="quiz-field">
              <label htmlFor="numQuestions">Questions</label>
              <select id="numQuestions" value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))}>
                <option value={5}>5 Questions</option>
                <option value={10}>10 Questions</option>
                <option value={15}>15 Questions</option>
              </select>
            </div>
          </div>

          <button type="submit" className="quiz-submit-btn" disabled={loading}>
            {loading ? (
              <span className="quiz-loading">
                <span className="spinner"></span> Generating AI Quiz...
              </span>
            ) : (
              'Generate Quiz'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
