import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function QuizSession({ quiz, onFinish }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // Mapping of index -> user selected option string
  const [showExplanation, setShowExplanation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currentQuestion = quiz.questions[currentIndex];
  const isAnswered = answers[currentIndex] !== undefined;
  const isLastQuestion = currentIndex === quiz.questions.length - 1;

  const handleOptionSelect = (option) => {
    if (isAnswered) return; // Prevent changing answer
    setAnswers(prev => ({ ...prev, [currentIndex]: option }));
    setShowExplanation(true);
  };

  const handleNext = () => {
    setShowExplanation(false);
    setCurrentIndex(prev => prev + 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = quiz.questions.map((q, idx) => ({
        question_id: q.id,
        user_answer: answers[idx] || ''
      }));

      const response = await fetch(`http://localhost:8000/api/quiz/${quiz.quiz_id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('ep_token')}`
        },
        body: JSON.stringify({ answers: payload })
      });

      if (!response.ok) throw new Error('Failed to submit quiz');
      
      const result = await response.json();
      onFinish(result);
    } catch (err) {
      console.error(err);
      alert('Failed to submit quiz scores.');
    } finally {
      setSubmitting(false);
    }
  };

  const getOptionClass = (option) => {
    if (!isAnswered) return 'quiz-option';
    
    if (option === currentQuestion.correct_answer) {
      return 'quiz-option correct';
    }
    
    if (answers[currentIndex] === option && option !== currentQuestion.correct_answer) {
      return 'quiz-option incorrect';
    }
    
    return 'quiz-option disabled';
  };

  return (
    <div className="quiz-session">
      <div className="quiz-progress-bar">
        <div 
          className="quiz-progress-fill" 
          style={{ width: `${((currentIndex) / quiz.questions.length) * 100}%` }}
        />
      </div>
      
      <div className="quiz-header-bar">
        <span>Question {currentIndex + 1} of {quiz.questions.length}</span>
        <span className="quiz-badge">{quiz.difficulty}</span>
      </div>

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
              disabled={isAnswered}
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

        {showExplanation && (
          <div className={`quiz-explanation ${answers[currentIndex] === currentQuestion.correct_answer ? 'correct-bg' : 'incorrect-bg'}`}>
            <div className="quiz-explanation-header">
              {answers[currentIndex] === currentQuestion.correct_answer ? (
                <><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Correct!</>
              ) : (
                <><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> Incorrect</>
              )}
            </div>
            <div className="quiz-explanation-body">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {currentQuestion.explanation}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      <div className="quiz-footer">
        {isAnswered && (
          isLastQuestion ? (
            <button className="quiz-btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Finish Quiz'}
            </button>
          ) : (
            <button className="quiz-btn-primary" onClick={handleNext}>
              Next Question <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          )
        )}
      </div>
    </div>
  );
}
