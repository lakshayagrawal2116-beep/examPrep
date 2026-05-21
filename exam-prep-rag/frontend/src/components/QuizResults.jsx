import QuizReview from './QuizReview';

export default function QuizResults({ score, onRetake }) {
  const percentage = Math.round((score.score / score.total_questions) * 100);

  let message = '';
  if (percentage >= 90) message = "Excellent work! You've mastered this topic.";
  else if (percentage >= 70) message = 'Great job! Just a few areas to review.';
  else if (percentage >= 50) message = 'Good start, but you might want to reread your notes.';
  else message = 'Keep studying! Review the explanations below.';

  const reviewQuiz = score.review?.length
    ? {
        id: score.quiz_id,
        topic: score.topic || 'Quiz',
        difficulty: score.difficulty || '',
        score: score.score,
        total_questions: score.total_questions,
        created_at: null,
        questions: score.review,
      }
    : null;

  return (
    <div className="quiz-results">
      <div className="quiz-results-card">
        <div className="quiz-score-circle">
          <svg viewBox="0 0 36 36" className="circular-chart">
            <path
              className="circle-bg"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="circle"
              strokeDasharray={`${percentage}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <text x="18" y="20.35" className="percentage">{percentage}%</text>
          </svg>
        </div>

        <h2>{score.score} out of {score.total_questions} correct</h2>
        <p className="quiz-results-msg">{message}</p>

        <button className="quiz-btn-primary" onClick={onRetake}>
          Take Another Quiz
        </button>
      </div>

      {reviewQuiz && (
        <div className="quiz-results-review">
          <QuizReview quiz={reviewQuiz} onBack={null} />
        </div>
      )}
    </div>
  );
}
