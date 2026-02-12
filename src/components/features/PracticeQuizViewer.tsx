'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, ChevronRight, RotateCcw, Loader2, ArrowRight } from 'lucide-react';
import { QuizLeaderboard } from '@/components/social/QuizLeaderboard';


interface PracticeQuestion {
  id: number;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'fill-blank';
  difficulty: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

interface PracticeQuiz {
  topic: string;
  totalQuestions: number;
  questions: PracticeQuestion[];
}

interface PracticeQuizViewerProps {
  quiz: PracticeQuiz;
  queryId: string; // Added queryId prop
}

export function PracticeQuizViewer({ quiz, queryId }: PracticeQuizViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [submittingScore, setSubmittingScore] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  // Reset start time when quiz starts/resets
  useEffect(() => {
    setStartTime(Date.now());
  }, []);

  const currentQuestion = quiz.questions[currentIndex];
  const userAnswer = answers[currentQuestion.id];
  const isCorrect = userAnswer?.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase().trim();

  const handleAnswer = (answer: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: answer });
    setShowAnswer(true);
  };

  const nextQuestion = () => {
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
    } else {
      // Quiz finished - submit score
      handleQuizComplete();
    }
  };

  const handleQuizComplete = async () => {
    setQuizComplete(true);
    
    // Calculate score and time
    const correctAnswers = quiz.questions.filter(q => 
      answers[q.id]?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()
    ).length;
    
    const timeSpent = Math.floor((Date.now() - startTime) / 1000); // in seconds

    // Submit score to backend
    await submitScore(correctAnswers, quiz.totalQuestions, timeSpent);
  };

  const submitScore = async (score: number, totalQuestions: number, timeSpent: number) => {
    setSubmittingScore(true);
    try {
      const response = await fetch('/api/quiz/submit-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryId,
          score,
          totalQuestions,
          timeSpent,
        }),
      });

      if (response.ok) {
        console.log('✅ Quiz score saved successfully');
        setScoreSubmitted(true);

        // ✅ Schedule spaced repetition reminders (day 3 + day 7)
        fetch('/api/quiz/schedule-reminders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ queryId }),
        }).catch(() => {});
      } else {
        console.error('❌ Failed to save quiz score');
      }
    } catch (error) {
      console.error('❌ Error submitting quiz score:', error);
    } finally {
      setSubmittingScore(false);
    }
  };

  const resetQuiz = () => {
    setCurrentIndex(0);
    setAnswers({});
    setShowAnswer(false);
    setQuizComplete(false);
    setStartTime(Date.now());
    setScoreSubmitted(false);
  };

  // Calculate score
  const score = quiz.questions.filter(q => 
    answers[q.id]?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()
  ).length;

  const percentage = Math.round((score / quiz.totalQuestions) * 100);

  const difficultyColors = {
    easy: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    hard: 'bg-red-100 text-red-700',
  };

  if (quizComplete) {
    return (
      <div className="space-y-6">
        {/* Celebration Card */}
        <div className="rounded-2xl overflow-hidden shadow-lg">
          {/* Gradient Header */}
          <div className={
            "p-8 text-center text-white " +
            (percentage >= 80
              ? "bg-gradient-to-br from-green-500 to-emerald-600"
              : percentage >= 60
              ? "bg-gradient-to-br from-yellow-500 to-orange-500"
              : "bg-gradient-to-br from-blue-500 to-indigo-600")
          }>
            {/* Big emoji */}
            <div className="text-7xl mb-3 animate-bounce">
              {percentage >= 80 ? "🎉" : percentage >= 60 ? "💪" : "📚"}
            </div>

            <h3 className="text-2xl font-bold mb-1">
              {percentage >= 80 ? "Outstanding!" : percentage >= 60 ? "Nice Work!" : "Keep Practising!"}
            </h3>

            {/* Score */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <span className="text-6xl font-extrabold">{percentage}%</span>
            </div>
            <p className="text-white/80 mt-1 text-sm">
              {score} of {quiz.totalQuestions} correct
            </p>
          </div>

          {/* Stats Row */}
          <div className="bg-white grid grid-cols-3 divide-x border-t">
            <div className="text-center py-4 px-2">
              <p className="text-xl font-bold text-gray-900">{score}/{quiz.totalQuestions}</p>
              <p className="text-xs text-gray-400 mt-0.5">Score</p>
            </div>
            <div className="text-center py-4 px-2">
              <p className="text-xl font-bold text-gray-900">
                {Math.floor((Date.now() - startTime) / 60000)}m
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Time</p>
            </div>
            <div className="text-center py-4 px-2">
              <p className="text-xl font-bold text-gray-900">
                {quiz.questions.filter(q => q.difficulty === "hard" &&
                  answers[q.id]?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()
                ).length}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Hard ✓</p>
            </div>
          </div>
        </div>

        {/* Spaced repetition notice */}
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-indigo-50 border border-indigo-100">
          <span className="text-2xl">⏰</span>
          <div>
            <p className="text-sm font-semibold text-indigo-800">Reminders scheduled</p>
            <p className="text-xs text-indigo-600 mt-0.5">
              We'll remind you to review this topic again in 3 days and 7 days for best retention.
            </p>
          </div>
        </div>

        {/* Score save status */}
        {submittingScore && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving your score...
          </div>
        )}
        {scoreSubmitted && (
          <p className="text-center text-sm text-green-600 font-medium">
            ✅ Score saved to leaderboard!
          </p>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={resetQuiz} variant="outline" className="h-11">
            <RotateCcw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button
            onClick={() => window.location.href = "/explore"}
            className="h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            Learn More
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Leaderboard */}
        <QuizLeaderboard queryId={queryId} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          Question {currentIndex + 1} of {quiz.totalQuestions}
        </span>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          difficultyColors[currentQuestion.difficulty as keyof typeof difficultyColors]
        }`}>
          {currentQuestion.difficulty.toUpperCase()}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / quiz.totalQuestions) * 100}%` }}
        />
      </div>

      {/* Question */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-6">
            {/* Question Text */}
            <h3 className="text-lg sm:text-xl font-semibold leading-relaxed">
              {currentQuestion.question}
            </h3>

            {/* Answer Options */}
            <div className="space-y-3">
              {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
                <div className="space-y-2">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswer(option)}
                      disabled={showAnswer}
                      className={`w-full text-left p-3 sm:p-4 rounded-lg border-2 transition-colors ${
                        showAnswer
                          ? option === currentQuestion.correctAnswer
                            ? 'border-green-500 bg-green-50'
                            : option === userAnswer
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200'
                          : userAnswer === option
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-500 flex-shrink-0">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <span className="text-sm sm:text-base">{option}</span>
                        {showAnswer && option === currentQuestion.correctAnswer && (
                          <CheckCircle2 className="ml-auto h-5 w-5 text-green-600 flex-shrink-0" />
                        )}
                        {showAnswer && option === userAnswer && option !== currentQuestion.correctAnswer && (
                          <XCircle className="ml-auto h-5 w-5 text-red-600 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'true-false' && (
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {['True', 'False'].map((option) => (
                    <button
                      key={option}
                      onClick={() => handleAnswer(option)}
                      disabled={showAnswer}
                      className={`p-3 sm:p-4 rounded-lg border-2 font-semibold text-sm sm:text-base transition-colors ${
                        showAnswer
                          ? option === currentQuestion.correctAnswer
                            ? 'border-green-500 bg-green-50'
                            : option === userAnswer
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200'
                          : userAnswer === option
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {(currentQuestion.type === 'short-answer' || currentQuestion.type === 'fill-blank') && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Type your answer..."
                    value={userAnswer || ''}
                    onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
                    disabled={showAnswer}
                    className="w-full p-3 border-2 rounded-lg focus:outline-none focus:border-blue-500 text-sm sm:text-base"
                  />
                  {!showAnswer && (
                    <Button
                      onClick={() => handleAnswer(userAnswer || '')}
                      disabled={!userAnswer}
                      className="w-full"
                    >
                      Submit Answer
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Feedback */}
            {showAnswer && (
              <div className={`p-3 sm:p-4 rounded-lg ${
                isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
              }`}>
                <div className="flex items-start gap-3">
                  {isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-2">
                    <p className={`font-semibold text-sm sm:text-base ${isCorrect ? 'text-green-900' : 'text-red-900'}`}>
                      {isCorrect ? 'Correct!' : 'Incorrect'}
                    </p>
                    {!isCorrect && (
                      <p className="text-xs sm:text-sm text-red-800">
                        <strong>Correct answer:</strong> {currentQuestion.correctAnswer}
                      </p>
                    )}
                    <p className="text-xs sm:text-sm text-gray-700">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      {showAnswer && (
        <Button onClick={nextQuestion} size="lg" className="w-full">
          {currentIndex < quiz.questions.length - 1 ? (
            <>
              Next Question
              <ChevronRight className="ml-2 h-5 w-5" />
            </>
          ) : (
            'Finish Quiz'
          )}
        </Button>
      )}
    </div>
  );
}
