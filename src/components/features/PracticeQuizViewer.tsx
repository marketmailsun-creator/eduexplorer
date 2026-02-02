'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, ChevronRight, RotateCcw } from 'lucide-react';

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
}

export function PracticeQuizViewer({ quiz }: PracticeQuizViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);

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
      setQuizComplete(true);
    }
  };

  const resetQuiz = () => {
    setCurrentIndex(0);
    setAnswers({});
    setShowAnswer(false);
    setQuizComplete(false);
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
      <Card>
        <CardContent className="p-8 text-center">
          <div className="space-y-6">
            <div className="text-6xl mb-4">
              {percentage >= 80 ? '🎉' : percentage >= 60 ? '👍' : '📚'}
            </div>
            <h3 className="text-3xl font-bold">Quiz Complete!</h3>
            <div className="text-5xl font-bold text-blue-600">
              {score} / {quiz.totalQuestions}
            </div>
            <p className="text-xl text-muted-foreground">
              {percentage}% Correct
            </p>
            <div className="pt-4">
              {percentage >= 80 ? (
                <p className="text-green-600 font-semibold">Excellent work! 🌟</p>
              ) : percentage >= 60 ? (
                <p className="text-yellow-600 font-semibold">Good effort! Keep practicing! 💪</p>
              ) : (
                <p className="text-orange-600 font-semibold">Review the material and try again! 📖</p>
              )}
            </div>
            <Button onClick={resetQuiz} size="lg" className="mt-4">
              <RotateCcw className="mr-2 h-5 w-5" />
              Retake Quiz
            </Button>
          </div>
        </CardContent>
      </Card>
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
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Question Text */}
            <h3 className="text-xl font-semibold leading-relaxed">
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
                      className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
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
                        <span className="font-semibold text-gray-500">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <span>{option}</span>
                        {showAnswer && option === currentQuestion.correctAnswer && (
                          <CheckCircle2 className="ml-auto h-5 w-5 text-green-600" />
                        )}
                        {showAnswer && option === userAnswer && option !== currentQuestion.correctAnswer && (
                          <XCircle className="ml-auto h-5 w-5 text-red-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'true-false' && (
                <div className="grid grid-cols-2 gap-4">
                  {['True', 'False'].map((option) => (
                    <button
                      key={option}
                      onClick={() => handleAnswer(option)}
                      disabled={showAnswer}
                      className={`p-4 rounded-lg border-2 font-semibold transition-colors ${
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
                    className="w-full p-3 border-2 rounded-lg focus:outline-none focus:border-blue-500"
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
              <div className={`p-4 rounded-lg ${
                isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
              }`}>
                <div className="flex items-start gap-3">
                  {isCorrect ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-2">
                    <p className={`font-semibold ${isCorrect ? 'text-green-900' : 'text-red-900'}`}>
                      {isCorrect ? 'Correct!' : 'Incorrect'}
                    </p>
                    {!isCorrect && (
                      <p className="text-sm text-red-800">
                        <strong>Correct answer:</strong> {currentQuestion.correctAnswer}
                      </p>
                    )}
                    <p className="text-sm text-gray-700">
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
