import { useState } from 'react';
import QuizSetup from './QuizSetup';
import QuizSession from './QuizSession';
import QuizResults from './QuizResults';

export default function QuizPlatform() {
  const [quizState, setQuizState] = useState('setup'); // setup, session, results
  const [quizData, setQuizData] = useState(null); // The generated quiz object
  const [quizScore, setQuizScore] = useState(null);

  const handleQuizStart = (generatedQuiz) => {
    setQuizData(generatedQuiz);
    setQuizState('session');
  };

  const handleQuizFinish = (results) => {
    setQuizScore(results);
    setQuizState('results');
  };

  const resetQuiz = () => {
    setQuizData(null);
    setQuizScore(null);
    setQuizState('setup');
  };

  return (
    <div className="quiz-platform">
      {quizState === 'setup' && <QuizSetup onStart={handleQuizStart} />}
      {quizState === 'session' && quizData && <QuizSession quiz={quizData} onFinish={handleQuizFinish} />}
      {quizState === 'results' && quizScore && <QuizResults score={quizScore} onRetake={resetQuiz} />}
    </div>
  );
}
