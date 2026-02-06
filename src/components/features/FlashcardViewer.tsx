'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Shuffle, RotateCcw } from 'lucide-react';
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
}

export function FlashcardViewer({ deck }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cards, setCards] = useState(deck.cards);

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const nextCard = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  };

  const shuffleCards = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const reset = () => {
    setCards(deck.cards);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const difficultyColors = {
    easy: 'bg-green-500',
    medium: 'bg-yellow-500',
    hard: 'bg-red-500',
  };

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
        <div>
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold">{deck.topic}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {currentIndex + 1} of {cards.length} cards
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={shuffleCards} className="text-xs sm:text-sm">
            <Shuffle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Shuffle</span>
          </Button>
          <Button size="sm" variant="outline" onClick={reset} className="text-xs sm:text-sm">
            <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
        <div
          className="bg-blue-600 h-1.5 sm:h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Flashcard - Mobile Optimized */}
      <div className="perspective-1000">
        <div
          className={`relative w-full cursor-pointer transition-transform duration-500 preserve-3d`}
          onClick={flipCard}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: '280px', // Fixed minimum height for mobile
          }}
        >
          {/* Front - Question */}
          <Card
            className={`absolute inset-0 backface-hidden ${
              isFlipped ? 'invisible' : 'visible'
            }`}
          >
            <CardContent className="flex flex-col items-center justify-center h-full p-4 sm:p-6 md:p-8 bg-gradient-to-br from-blue-50 to-purple-50 min-h-[280px] sm:min-h-[320px] md:min-h-[360px]">
              {/* Difficulty Badge - Mobile Optimized */}
              <div className="absolute top-2 sm:top-3 md:top-4 right-2 sm:right-3 md:right-4">
                <span
                  className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold text-white ${
                    difficultyColors[currentCard.difficulty]
                  }`}
                >
                  {currentCard.difficulty.toUpperCase()}
                </span>
              </div>

              {/* Category - Mobile Optimized */}
              <div className="absolute top-2 sm:top-3 md:top-4 left-2 sm:left-3 md:left-4">
                <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-700">
                  {currentCard.category}
                </span>
              </div>

              {/* Question - Mobile Optimized Text Size */}
              <div className="text-center space-y-2 sm:space-y-3 md:space-y-4 px-2">
                <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-2 sm:mb-3 md:mb-4">❓</div>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-800 leading-snug sm:leading-relaxed">
                  {currentCard.question}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-4 sm:mt-6 md:mt-8">
                  Click to see answer
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Back - Answer */}
          <Card
            className={`absolute inset-0 backface-hidden ${
              isFlipped ? 'visible' : 'invisible'
            }`}
            style={{
              transform: 'rotateY(180deg)',
              backfaceVisibility: 'hidden',
            }}
          >
            <CardContent className="flex flex-col items-center justify-center h-full p-4 sm:p-6 md:p-8 bg-gradient-to-br from-green-50 to-blue-50 min-h-[280px] sm:min-h-[320px] md:min-h-[360px]">
              {/* Answer - Mobile Optimized Text Size */}
              <div className="text-center space-y-2 sm:space-y-3 md:space-y-4 px-2">
                <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-2 sm:mb-3 md:mb-4">✓</div>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-gray-800 leading-snug sm:leading-relaxed">
                  {currentCard.answer}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-4 sm:mt-6 md:mt-8">
                  Click to see question
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation Buttons - Mobile Optimized */}
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <Button
          onClick={prevCard}
          disabled={currentIndex === 0}
          variant="outline"
          size="sm"
          className="flex-1 sm:flex-none text-xs sm:text-sm h-9 sm:h-10"
        >
          <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          <span className="hidden xs:inline">Previous</span>
          <span className="xs:hidden">Prev</span>
        </Button>

        <div className="text-xs sm:text-sm text-gray-600 text-center px-2">
          <span className="font-medium">{currentIndex + 1}</span>
          <span className="mx-1">/</span>
          <span>{deck.cards.length}</span>
        </div>

        <Button
          onClick={nextCard}
          disabled={currentIndex === deck.cards.length - 1}
          variant="outline"
          size="sm"
          className="flex-1 sm:flex-none text-xs sm:text-sm h-9 sm:h-10"
        >
          <span className="hidden xs:inline">Next</span>
          <span className="xs:hidden">Next</span>
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
        </Button>
      </div>

      {/* Quick Stats - Mobile Optimized */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-3 sm:pt-4 border-t">
        <div className="text-center">
          <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">
            {cards.filter(c => c.difficulty === 'easy').length}
          </div>
          <div className="text-xs text-muted-foreground">Easy</div>
        </div>
        <div className="text-center">
          <div className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-600">
            {cards.filter(c => c.difficulty === 'medium').length}
          </div>
          <div className="text-xs text-muted-foreground">Medium</div>
        </div>
        <div className="text-center">
          <div className="text-lg sm:text-xl md:text-2xl font-bold text-red-600">
            {cards.filter(c => c.difficulty === 'hard').length}
          </div>
          <div className="text-xs text-muted-foreground">Hard</div>
        </div>
      </div>
    </div>
  );
}
