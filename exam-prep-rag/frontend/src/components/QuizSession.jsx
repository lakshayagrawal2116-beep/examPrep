import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useToast } from '../context/ToastContext';
import { checkQuizAnswer, submitQuiz } from '../utils/api';

export default function QuizSession({ quiz, onFinish }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const toast = useToast();

  const currentQuestion = quiz.questions[currentIndex];
  const currentFeedback = feedback[currentIndex];
  const isAnswered = answers[currentIndex] !== undefined;
  const isLastQuestion = currentIndex === quiz.questions.length - 1;

  const handleOptionSelect = async (option) => {
    if (isAnswered || checking) return;
    setChecking(true);
    try {
      const result = await checkQuizAnswer(quiz.quiz_id, currentQuestion.id, option);
      setAnswers((prev) => ({ ...prev, [currentIndex]: option }));
      setFeedback((prev) => ({ ...prev, [currentIndex]: result }));
      setShowFeedback(true);
    } catch (err) {
      toast.error(err.message || 'Could not verify answer');
    } finally {
      setChecking(false);
    }
  };

  const handleNext = () => {
    setShowFeedback(false);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = quiz.questions.map((q, idx) => ({
        question_id: q.id,
        user_answer: answers[idx] || '',
      }));
      const result = await submitQuiz(quiz.quiz_id, payload);
      onFinish({
        ...result,
        quiz_id: quiz.quiz_id,
        topic: quiz.topic,
        difficulty: quiz.difficulty,
      });
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getOptionClass = (option) => {
    if (!isAnswered || !currentFeedback) return 'quiz-option';

    const selected = answers[currentIndex];
    if (option !== selected) {
      return 'quiz-option disabled';
    }

    return currentFeedback.is_correct ? 'quiz-option correct' : 'quiz-option incorrect';
  };

  return (
    <div className="quiz-session">
      <div className="quiz-progress-bar">
        <div
          className="quiz-progress-fill"
          style={{ width: `${(currentIndex / quiz.questions.length) * 100}%` }}
        />
      </div>

      <div className="quiz-header-bar">
        <span>Question {currentIndex + 1} of {quiz.questions.length}</span>
        <span className="quiz-badge">{quiz.difficulty}</span>
      </div>

      <p className="quiz-exam-notice">
        Answers and explanations are hidden until you finish the quiz.
      </p>

      <div className="quiz-question-card">
        <div className="quiz-question-text">
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {currentQuestion.question_text}
          </ReactMarkdown>
        </div>

        <div className="quiz-options">
          {currentQuestion.options.map((option, idx) => (
            <button
              key={idx}
              className={getOptionClass(option)}
              onClick={() => handleOptionSelect(option)}
              disabled={isAnswered || checking}
            >
              <span className="quiz-option-letter">{String.fromCharCode(65 + idx)}</span>
              <span className="quiz-option-text">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {option}
                </ReactMarkdown>
              </span>
            </button>
          ))}
        </div>

        {checking && (
          <p className="quiz-help" style={{ marginTop: '12px' }}>Checking your answer...</p>
        )}

        {showFeedback && currentFeedback && (
          <div
            className={`quiz-explanation ${currentFeedback.is_correct ? 'correct-bg' : 'incorrect-bg'}`}
          >
            <div className="quiz-explanation-header">
              {currentFeedback.is_correct ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  Correct!
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  Incorrect. The correct answer will be shown after you submit.
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="quiz-footer">
        {isAnswered && (
          isLastQuestion ? (
            <button className="quiz-btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Finish Quiz & See Answers'}
            </button>
          ) : (
            <button className="quiz-btn-primary" onClick={handleNext}>
              Next Question
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          )
        )}
      </div>
    </div>
  );
}
