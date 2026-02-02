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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">{deck.topic}</h3>
          <p className="text-sm text-muted-foreground">
            {currentIndex + 1} of {cards.length} cards
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={shuffleCards}>
            <Shuffle className="h-4 w-4 mr-2" />
            Shuffle
          </Button>
          <Button size="sm" variant="outline" onClick={reset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Flashcard */}
      <div className="perspective-1000">
        <div
          className={`relative w-full aspect-[3/2] cursor-pointer transition-transform duration-500 preserve-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          onClick={flipCard}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front - Question */}
          <Card
            className={`absolute inset-0 backface-hidden ${
              isFlipped ? 'invisible' : 'visible'
            }`}
          >
            <CardContent className="flex flex-col items-center justify-center h-full p-8 bg-gradient-to-br from-blue-50 to-purple-50">
              {/* Difficulty Badge */}
              <div className="absolute top-4 right-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
                    difficultyColors[currentCard.difficulty]
                  }`}
                >
                  {currentCard.difficulty.toUpperCase()}
                </span>
              </div>

              {/* Category */}
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-700">
                  {currentCard.category}
                </span>
              </div>

              {/* Question */}
              <div className="text-center space-y-4">
                <div className="text-6xl mb-4">❓</div>
                <p className="text-2xl md:text-3xl font-semibold text-gray-800 leading-relaxed">
                  {currentCard.question}
                </p>
                <p className="text-sm text-gray-500 mt-8">
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
            <CardContent className="flex flex-col items-center justify-center h-full p-8 bg-gradient-to-br from-green-50 to-blue-50">
              {/* Answer */}
              <div className="text-center space-y-4">
                <div className="text-6xl mb-4">✓</div>
                <p className="text-xl md:text-2xl text-gray-800 leading-relaxed">
                  {currentCard.answer}
                </p>
                <p className="text-sm text-gray-500 mt-8">
                  Click to see question
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          size="lg"
          variant="outline"
          onClick={prevCard}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-5 w-5 mr-2" />
          Previous
        </Button>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {isFlipped ? 'Showing answer' : 'Showing question'}
          </p>
        </div>

        <Button
          size="lg"
          variant="outline"
          onClick={nextCard}
          disabled={currentIndex === cards.length - 1}
        >
          Next
          <ChevronRight className="h-5 w-5 ml-2" />
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {cards.filter(c => c.difficulty === 'easy').length}
          </div>
          <div className="text-xs text-muted-foreground">Easy</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {cards.filter(c => c.difficulty === 'medium').length}
          </div>
          <div className="text-xs text-muted-foreground">Medium</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {cards.filter(c => c.difficulty === 'hard').length}
          </div>
          <div className="text-xs text-muted-foreground">Hard</div>
        </div>
      </div>
    </div>
  );
}
