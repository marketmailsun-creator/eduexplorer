'use client';
// ============================================================
// FILE: src/components/features/FlashcardViewer.tsx  (REPLACE EXISTING)
// Enhanced with:
//   - ✅ "Got it" / ❌ "Review again" mastery buttons on the answer side
//   - 📊 Mastery progress bar (X / Y cards mastered)
//   - Mastery state persists in localStorage per deck
//   - Review-only mode: filter down to just cards needing review
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Shuffle, RotateCcw, CheckCircle2, XCircle, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Flashcard {
  id: number;
  question: string;
  answer: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface FlashcardDeck {
  topic: string;
  level: string;
  totalCards: number;
  cards: Flashcard[];
}

interface FlashcardViewerProps {
  deck: FlashcardDeck;
  deckId?: string; // used as localStorage key; falls back to topic slug
}

type MasteryMap = Record<number, 'known' | 'review'>;

export function FlashcardViewer({ deck, deckId }: FlashcardViewerProps) {
  const storageKey = `flashcard-mastery-${deckId ?? deck.topic.toLowerCase().replace(/\s+/g, '-')}`;

  const [cards, setCards] = useState<Flashcard[]>(deck.cards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [mastery, setMastery] = useState<MasteryMap>({});
  const [reviewOnly, setReviewOnly] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);

  // Load saved mastery from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setMastery(JSON.parse(saved));
    } catch {}
  }, [storageKey]);

  // Persist mastery to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(mastery));
    } catch {}
  }, [mastery, storageKey]);

  // Recompute active card list when reviewOnly or mastery changes
  const activeCards = useCallback(() => {
    if (!reviewOnly) return cards;
    const reviewCards = cards.filter(c => mastery[c.id] !== 'known');
    return reviewCards.length > 0 ? reviewCards : cards; // fallback to all if all known
  }, [cards, mastery, reviewOnly])();

  const currentCard = activeCards[currentIndex] ?? activeCards[0];
  const masteredCount = deck.cards.filter(c => mastery[c.id] === 'known').length;
  const masteryPct = Math.round((masteredCount / deck.cards.length) * 100);
  const progressPct = activeCards.length > 0
    ? ((currentIndex + 1) / activeCards.length) * 100
    : 100;

  // ── Navigation ──────────────────────────────────────────────
  const nextCard = () => {
    if (currentIndex < activeCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      setSessionComplete(true);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
      setSessionComplete(false);
    }
  };

  // ── Mastery Actions ─────────────────────────────────────────
  const markKnown = () => {
    setMastery(prev => ({ ...prev, [currentCard.id]: 'known' }));
    nextCard();
  };

  const markReview = () => {
    setMastery(prev => ({ ...prev, [currentCard.id]: 'review' }));
    nextCard();
  };

  // ── Shuffle / Reset ─────────────────────────────────────────
  const shuffleCards = () => {
    setCards(prev => [...prev].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionComplete(false);
  };

  const reset = () => {
    setCards(deck.cards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionComplete(false);
    setReviewOnly(false);
  };

  const resetMastery = () => {
    setMastery({});
    reset();
  };

  const difficultyColors: Record<string, string> = {
    easy: 'bg-green-500',
    medium: 'bg-yellow-500',
    hard: 'bg-red-500',
  };

  // ── Session Complete Screen ──────────────────────────────────
  if (sessionComplete) {
    const reviewCount = deck.cards.filter(c => mastery[c.id] === 'review').length;
    return (
      <div className="space-y-4 text-center py-6">
        <div className="text-6xl mb-2">{masteryPct === 100 ? '🏆' : masteryPct >= 70 ? '🎉' : '💪'}</div>
        <h3 className="text-xl font-bold text-gray-900">Session Complete!</h3>

        {/* Mastery bar */}
        <div className="max-w-sm mx-auto">
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>Mastery</span>
            <span className="font-semibold text-gray-900">{masteredCount}/{deck.cards.length} cards</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-700"
              style={{ width: `${masteryPct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">{masteryPct}% mastered</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {reviewCount > 0 && (
            <Button
              onClick={() => { setReviewOnly(true); setCurrentIndex(0); setSessionComplete(false); }}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
            >
              Review {reviewCount} flagged card{reviewCount !== 1 ? 's' : ''}
            </Button>
          )}
          <Button variant="outline" onClick={() => { setCurrentIndex(0); setSessionComplete(false); }}>
            <RotateCcw className="h-4 w-4 mr-1" /> All cards again
          </Button>
          <Button variant="ghost" onClick={resetMastery} className="text-gray-400 text-xs">
            Reset mastery
          </Button>
        </div>
      </div>
    );
  }

  // ── Main Viewer ──────────────────────────────────────────────
  return (
    <div className="space-y-3 sm:space-y-4">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="text-lg sm:text-xl font-bold">{deck.topic}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {reviewOnly ? '🔁 Review mode — ' : ''}
            Card {currentIndex + 1} of {activeCards.length}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Review toggle */}
          {Object.keys(mastery).length > 0 && (
            <Button
              size="sm"
              variant={reviewOnly ? 'default' : 'outline'}
              onClick={() => { setReviewOnly(v => !v); setCurrentIndex(0); setIsFlipped(false); }}
              className="text-xs"
            >
              {reviewOnly ? '📋 All cards' : `🔁 Review (${deck.cards.filter(c => mastery[c.id] === 'review').length})`}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={shuffleCards} className="text-xs">
            <Shuffle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Shuffle</span>
          </Button>
          <Button size="sm" variant="outline" onClick={reset} className="text-xs">
            <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
        </div>
      </div>

      {/* Mastery bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-xs font-semibold text-gray-600">
              {masteredCount}/{deck.cards.length} mastered
            </span>
          </div>
          <span className="text-xs text-gray-400">{masteryPct}%</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-500"
            style={{ width: `${masteryPct}%` }}
          />
        </div>
      </div>

      {/* Deck progress */}
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Card */}
      <div className="perspective-1000">
        <div
          className="relative w-full cursor-pointer transition-transform duration-500 preserve-3d"
          onClick={() => setIsFlipped(v => !v)}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: '280px',
          }}
        >
          {/* Front — Question */}
          <Card
            className={`absolute inset-0 backface-hidden ${isFlipped ? 'invisible' : 'visible'}`}
            style={{ backfaceVisibility: 'hidden' }}
          >
            <CardContent className="flex flex-col items-center justify-center h-full p-4 sm:p-6 md:p-8 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-[280px] sm:min-h-[320px]">
              {/* Difficulty badge */}
              <div className="absolute top-3 right-3">
                <div className={`w-2.5 h-2.5 rounded-full ${difficultyColors[currentCard?.difficulty ?? 'medium']}`} />
              </div>
              <div className="text-center space-y-3 px-2">
                <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-4">Question</p>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-800 leading-relaxed font-medium">
                  {currentCard?.question}
                </p>
                <p className="text-xs text-gray-400 mt-6">Tap to reveal answer</p>
              </div>
            </CardContent>
          </Card>

          {/* Back — Answer */}
          <Card
            className={`absolute inset-0 backface-hidden ${isFlipped ? 'visible' : 'invisible'}`}
            style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}
          >
            <CardContent className="flex flex-col items-center justify-center h-full p-4 sm:p-6 md:p-8 bg-gradient-to-br from-green-50 to-emerald-50 min-h-[280px] sm:min-h-[320px]">
              <div className="text-center space-y-3 px-2 w-full">
                <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2">Answer</p>
                <p className="text-sm sm:text-base md:text-lg text-gray-800 leading-relaxed">
                  {currentCard?.answer}
                </p>

                {/* ✅ Mastery buttons — only shown on answer side */}
                <div
                  className="flex gap-3 justify-center mt-6 pt-4 border-t border-green-100"
                  onClick={e => e.stopPropagation()} // prevent card flip when clicking buttons
                >
                  <button
                    onClick={markReview}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-orange-200
                               bg-orange-50 text-orange-700 font-semibold text-sm
                               hover:bg-orange-100 hover:border-orange-300 transition-all"
                  >
                    <XCircle className="h-4 w-4" />
                    Review again
                  </button>
                  <button
                    onClick={markKnown}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-green-300
                               bg-green-100 text-green-800 font-semibold text-sm
                               hover:bg-green-200 hover:border-green-400 transition-all"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Got it!
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-2">
        <Button
          onClick={prevCard}
          disabled={currentIndex === 0}
          variant="outline"
          size="sm"
          className="flex-1 sm:flex-none text-xs sm:text-sm h-9 sm:h-10"
        >
          <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          Prev
        </Button>

        <div className="text-xs sm:text-sm text-gray-600 text-center px-2">
          <span className="font-medium">{currentIndex + 1}</span>
          <span className="mx-1">/</span>
          <span>{activeCards.length}</span>
        </div>

        <Button
          onClick={nextCard}
          disabled={currentIndex === activeCards.length - 1 && !isFlipped}
          variant="outline"
          size="sm"
          className="flex-1 sm:flex-none text-xs sm:text-sm h-9 sm:h-10"
        >
          Next
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-3 border-t">
        <div className="text-center">
          <div className="text-lg sm:text-xl font-bold text-green-600">
            {deck.cards.filter(c => c.difficulty === 'easy').length}
          </div>
          <div className="text-xs text-muted-foreground">Easy</div>
        </div>
        <div className="text-center">
          <div className="text-lg sm:text-xl font-bold text-yellow-600">
            {deck.cards.filter(c => c.difficulty === 'medium').length}
          </div>
          <div className="text-xs text-muted-foreground">Medium</div>
        </div>
        <div className="text-center">
          <div className="text-lg sm:text-xl font-bold text-red-600">
            {deck.cards.filter(c => c.difficulty === 'hard').length}
          </div>
          <div className="text-xs text-muted-foreground">Hard</div>
        </div>
      </div>
    </div>
  );
}
