import { useEffect, useState } from 'react';
import { getQuizHistory } from '../utils/api';

export default function QuizHistory({ onSelectQuiz }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getQuizHistory();
        if (!cancelled) setHistory(data);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load history');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <p className="quiz-help">Loading quiz history...</p>;
  }

  if (error) {
    return <p className="quiz-error" style={{ marginTop: '16px' }}>{error}</p>;
  }

  if (history.length === 0) {
    return (
      <p className="quiz-help" style={{ marginTop: '16px' }}>
        No completed quizzes yet. Finish a quiz to see it here.
      </p>
    );
  }

  return (
    <div className="quiz-history">
      <h3 className="quiz-history-title">Past Quizzes</h3>
      <ul className="quiz-history-list">
        {history.map((item) => {
          const pct = Math.round((item.score / item.total_questions) * 100);
          return (
            <li key={item.id}>
              <button
                type="button"
                className="quiz-history-item"
                onClick={() => onSelectQuiz(item.id)}
              >
                <span className="quiz-history-topic">{item.topic}</span>
                <span className="quiz-history-score">
                  {item.score}/{item.total_questions} ({pct}%)
                </span>
                <span className="quiz-history-date">
                  {item.created_at
                    ? new Date(item.created_at).toLocaleString()
                    : ''}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
