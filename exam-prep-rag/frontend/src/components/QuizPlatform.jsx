import { useState } from 'react';
import QuizSetup from './QuizSetup';
import QuizSession from './QuizSession';
import QuizResults from './QuizResults';
import QuizReview from './QuizReview';
import { useToast } from '../context/ToastContext';
import { getQuizDetail } from '../utils/api';

export default function QuizPlatform() {
  const [quizState, setQuizState] = useState('setup');
  const [quizData, setQuizData] = useState(null);
  const [quizScore, setQuizScore] = useState(null);
  const [historyDetail, setHistoryDetail] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const toast = useToast();

  const handleQuizStart = (generatedQuiz) => {
    setQuizData(generatedQuiz);
    setHistoryDetail(null);
    setQuizState('session');
  };

  const handleQuizFinish = (results) => {
    setQuizScore(results);
    setQuizState('results');
  };

  const handleViewHistory = async (quizId) => {
    setLoadingHistory(true);
    try {
      const detail = await getQuizDetail(quizId);
      setHistoryDetail(detail);
      setQuizState('review');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Could not load quiz');
    } finally {
      setLoadingHistory(false);
    }
  };

  const resetQuiz = () => {
    setQuizData(null);
    setQuizScore(null);
    setHistoryDetail(null);
    setQuizState('setup');
  };

  return (
    <div className="quiz-platform">
      {quizState === 'setup' && (
        <QuizSetup
          onStart={handleQuizStart}
          onViewHistory={handleViewHistory}
          loadingHistory={loadingHistory}
        />
      )}
      {quizState === 'session' && quizData && (
        <QuizSession quiz={quizData} onFinish={handleQuizFinish} />
      )}
      {quizState === 'results' && quizScore && (
        <QuizResults score={quizScore} onRetake={resetQuiz} />
      )}
      {quizState === 'review' && historyDetail && (
        <QuizReview quiz={historyDetail} onBack={resetQuiz} />
      )}
    </div>
  );
}
