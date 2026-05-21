import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function QuizReview({ quiz, onBack }) {
  const percentage = Math.round((quiz.score / quiz.total_questions) * 100);

  return (
    <div className="quiz-review">
      <div className="quiz-review-header">
        {onBack && (
          <button type="button" className="quiz-review-back" onClick={onBack}>
            ← Back
          </button>
        )}
        <div>
          <h2>{quiz.topic}</h2>
          <p className="quiz-review-meta">
            {quiz.difficulty} · {quiz.score}/{quiz.total_questions} correct ({percentage}%)
            {quiz.created_at && (
              <> · {new Date(quiz.created_at).toLocaleDateString()}</>
            )}
          </p>
        </div>
      </div>

      <div className="quiz-review-list">
        {quiz.questions.map((q, i) => (
          <div
            key={q.id}
            className={`quiz-review-item ${q.is_correct ? 'correct' : 'incorrect'}`}
          >
            <div className="quiz-review-qnum">Question {i + 1}</div>
            <div className="quiz-question-text">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {q.question_text}
              </ReactMarkdown>
            </div>
            <p className="quiz-review-answer-line">
              <strong>Your answer:</strong> {q.user_answer || '(no answer)'}
            </p>
            {!q.is_correct && (
              <p className="quiz-review-answer-line">
                <strong>Correct:</strong> {q.correct_answer}
              </p>
            )}
            <div className="quiz-explanation-body">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {q.explanation}
              </ReactMarkdown>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
