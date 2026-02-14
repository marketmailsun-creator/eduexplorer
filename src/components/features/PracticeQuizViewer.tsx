'use client';
// ============================================================
// FILE: src/components/features/PracticeQuizViewer.tsx — REPLACE EXISTING
// New features:
//   • "New Quiz Set" button — regenerates with fresh random questions
//   • Shows "Set X of Y" badge so users know they can get more
//   • Score history across sets
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, ChevronRight, RotateCcw, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PracticeQuestion {
  id: number;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'fill-blank';
  difficulty: 'easy' | 'medium' | 'hard';
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

interface PracticeQuiz {
  topic: string;
  totalQuestions: number;
  questions: PracticeQuestion[];
  setNumber?: number;
}

interface PracticeQuizViewerProps {
  quiz: PracticeQuiz;
  queryId: string;
  totalSets?: number;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy:   'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard:   'bg-red-100 text-red-700',
};

export function PracticeQuizViewer({ quiz: initialQuiz, queryId, totalSets = 1 }: PracticeQuizViewerProps) {
  const router = useRouter();
  const [quiz, setQuiz]                 = useState(initialQuiz);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers]           = useState<Record<number, string>>({});
  const [showAnswer, setShowAnswer]     = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [startTime]                     = useState(Date.now());
  const [regenerating, setRegenerating] = useState(false);
  const [inputValue, setInputValue]     = useState('');
  const [currentSetTotal, setCurrentSetTotal] = useState(totalSets);

  const currentQuestion = quiz.questions[currentIndex];
  const userAnswer      = answers[currentQuestion?.id];
  const normalize       = (v: unknown) => String(v ?? '').toLowerCase().trim();
  const isCorrect       = normalize(userAnswer) === normalize(currentQuestion?.correctAnswer);

  const handleAnswer = (answer: string) => {
    if (showAnswer) return;
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));
    setShowAnswer(true);
  };

  const nextQuestion = () => {
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
      setInputValue('');
    } else {
      handleQuizComplete();
    }
  };

  const handleQuizComplete = async () => {
    setQuizComplete(true);
    const correct   = quiz.questions.filter(q => normalize(answers[q.id]) === normalize(q.correctAnswer)).length;
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    try {
      await fetch('/api/quiz/submit-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryId, score: correct, totalQuestions: quiz.totalQuestions, timeSpent }),
      });
    } catch { /* silent */ }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await fetch('/api/content/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryId, regenerate: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');

      // Fetch the new quiz content
      const contentRes = await fetch(`/api/content/quiz/${data.quizId}`);
      const contentData = await contentRes.json();

      if (contentData.quiz) {
        setQuiz(contentData.quiz);
        setCurrentSetTotal(data.totalSets);
        setCurrentIndex(0);
        setAnswers({});
        setShowAnswer(false);
        setInputValue('');
        setQuizComplete(false);
      } else {
        // Fallback: refresh page
        router.refresh();
      }
    } catch (err) {
      console.error('Regen error:', err);
    } finally {
      setRegenerating(false);
    }
  };

  const score        = quiz.questions.filter(q => normalize(answers[q.id]) === normalize(q.correctAnswer)).length;
  const progressPct  = ((currentIndex + (showAnswer ? 1 : 0)) / quiz.questions.length) * 100;
  const setNumber    = quiz.setNumber ?? 1;

  // ── COMPLETE SCREEN ────────────────────────────────────────
  if (quizComplete) {
    const pct = Math.round((score / quiz.totalQuestions) * 100);
    const grade = pct >= 80 ? { emoji: '🏆', label: 'Excellent!', color: 'text-green-600' }
                : pct >= 60 ? { emoji: '💪', label: 'Good job!',  color: 'text-yellow-600' }
                :              { emoji: '📖', label: 'Keep practicing!', color: 'text-red-600' };

    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 px-6 py-8 text-center text-white">
          <div className="text-5xl mb-2">{grade.emoji}</div>
          <p className="text-xl font-extrabold">{grade.label}</p>
          <p className="text-indigo-200 text-sm mt-1">Quiz Set {setNumber} complete</p>
        </div>

        <div className="p-6 text-center">
          <div className="text-4xl font-extrabold text-gray-900 mb-1">
            {score}<span className="text-gray-400 text-2xl">/{quiz.totalQuestions}</span>
          </div>
          <p className={`text-lg font-bold ${grade.color} mb-6`}>{pct}% score</p>

          {/* Regenerate CTA */}
          <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 p-5 mb-4">
            <Sparkles className="h-5 w-5 text-indigo-500 mx-auto mb-2" />
            <p className="font-semibold text-gray-800 text-sm mb-1">Ready for a new challenge?</p>
            <p className="text-xs text-gray-500 mb-3">Get {quiz.totalQuestions} fresh questions on the same topic — none you've already seen</p>
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                         bg-gradient-to-r from-indigo-600 to-purple-600 text-white
                         font-bold text-sm hover:from-indigo-700 hover:to-purple-700
                         transition-all disabled:opacity-60"
            >
              {regenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {regenerating ? 'Generating…' : `Generate Quiz Set ${setNumber + 1}`}
            </button>
          </div>

          <button
            onClick={() => { setCurrentIndex(0); setAnswers({}); setShowAnswer(false); setInputValue(''); setQuizComplete(false); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                       border-2 border-gray-200 text-gray-600 font-semibold text-sm
                       hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="h-4 w-4" /> Retry This Set
          </button>
        </div>
      </div>
    );
  }

  // ── ACTIVE QUIZ ────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Quiz</span>
          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-semibold">
            Set {setNumber}
          </span>
        </div>
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500
                     hover:text-indigo-600 transition-colors disabled:opacity-50"
        >
          {regenerating
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <RefreshCw className="h-3.5 w-3.5" />
          }
          New questions
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="p-5 sm:p-6">
        {/* Question counter */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-gray-400 font-medium">
            Question {currentIndex + 1} of {quiz.questions.length}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${DIFFICULTY_COLORS[currentQuestion.difficulty] ?? 'bg-gray-100 text-gray-600'}`}>
            {currentQuestion.difficulty}
          </span>
        </div>

        {/* Question */}
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-5 leading-snug">
          {currentQuestion.question}
        </h3>

        {/* Answer options */}
        {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
          <div className="space-y-2.5">
            {currentQuestion.options.map((opt, i) => {
              const selected = userAnswer === opt;
              const correct  = showAnswer && opt === currentQuestion.correctAnswer;
              const wrong    = showAnswer && selected && opt !== currentQuestion.correctAnswer;
              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(opt)}
                  disabled={showAnswer}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium
                               transition-all duration-150 flex items-center gap-3
                               ${correct ? 'border-green-500 bg-green-50 text-green-800'
                               : wrong   ? 'border-red-400 bg-red-50 text-red-800'
                               : selected ? 'border-indigo-400 bg-indigo-50 text-indigo-800'
                               : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700'}`}
                >
                  <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs flex-shrink-0">
                    {['A','B','C','D'][i]}
                  </span>
                  <span className="flex-1">{opt}</span>
                  {correct && <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />}
                  {wrong   && <XCircle      className="h-4 w-4 text-red-500   flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        {currentQuestion.type === 'true-false' && (
          <div className="grid grid-cols-2 gap-3">
            {['True', 'False'].map(opt => {
              const selected = userAnswer === opt;
              const correct  = showAnswer && opt === currentQuestion.correctAnswer;
              const wrong    = showAnswer && selected && opt !== currentQuestion.correctAnswer;
              return (
                <button
                  key={opt}
                  onClick={() => handleAnswer(opt)}
                  disabled={showAnswer}
                  className={`py-4 rounded-xl border-2 font-bold text-sm transition-all
                               ${correct ? 'border-green-500 bg-green-50 text-green-800'
                               : wrong   ? 'border-red-400 bg-red-50 text-red-800'
                               : selected ? 'border-indigo-400 bg-indigo-50 text-indigo-800'
                               : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700'}`}
                >
                  {opt === 'True' ? '✓ True' : '✗ False'}
                </button>
              );
            })}
          </div>
        )}

        {(currentQuestion.type === 'short-answer' || currentQuestion.type === 'fill-blank') && (
          <div className="space-y-3">
            <textarea
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              disabled={showAnswer}
              placeholder={currentQuestion.type === 'fill-blank' ? 'Fill in the blank…' : 'Type your answer…'}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-400
                         focus:outline-none resize-none text-sm text-gray-800 placeholder-gray-400
                         disabled:bg-gray-50 transition-colors"
            />
            {!showAnswer && (
              <button
                onClick={() => handleAnswer(inputValue.trim())}
                disabled={!inputValue.trim()}
                className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm
                           hover:bg-indigo-700 disabled:opacity-40 transition-colors"
              >
                Submit Answer
              </button>
            )}
          </div>
        )}

        {/* Explanation */}
        {showAnswer && (
          <div className={`mt-4 p-4 rounded-xl border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              {isCorrect
                ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                : <XCircle      className="h-4 w-4 text-red-500"   />
              }
              <span className={`text-sm font-bold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                {isCorrect ? 'Correct!' : `Correct answer: ${String(currentQuestion.correctAnswer ?? '')}`}
              </span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">{currentQuestion.explanation}</p>
          </div>
        )}

        {/* Next button */}
        {showAnswer && (
          <button
            onClick={nextQuestion}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl
                       bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm
                       hover:from-indigo-700 hover:to-purple-700 transition-all"
          >
            {currentIndex < quiz.questions.length - 1 ? (
              <><ChevronRight className="h-4 w-4" /> Next Question</>
            ) : (
              <><CheckCircle2 className="h-4 w-4" /> View Results</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
