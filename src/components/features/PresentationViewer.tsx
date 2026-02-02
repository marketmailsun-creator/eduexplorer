'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PresentationSlide {
  id: number;
  type: 'title' | 'definition' | 'concept' | 'bullet-points' | 'equation' | 'comparison' | 'summary';
  duration?: number;
  title?: string;
  subtitle?: string;
  content?: string;
  points?: string[];
  equation?: string;
  leftTitle?: string;
  rightTitle?: string;
  leftContent?: string[];
  rightContent?: string[];
  background: string;
}

interface PresentationData {
  topic: string;
  level: string;
  totalSlides: number;
  slides: PresentationSlide[];
}

interface PresentationViewerProps {
  presentationData: PresentationData;
  autoPlay?: boolean;
}

export function PresentationViewer({ presentationData, autoPlay = false }: PresentationViewerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const slides = presentationData.slides || [];
  const totalSlides = slides.length;

  // Auto-advance slides
  useEffect(() => {
    if (!isPlaying || totalSlides === 0) return;

    const timer = setTimeout(() => {
      if (currentSlide < totalSlides - 1) {
        setCurrentSlide(prev => prev + 1);
      } else {
        setIsPlaying(false);
      }
    }, 8000); // 8 seconds per slide

    return () => clearTimeout(timer);
  }, [currentSlide, isPlaying, totalSlides]);

  const nextSlide = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (totalSlides === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No slides available
      </div>
    );
  }

  const slide = slides[currentSlide];

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-gray-900 p-8' : 'relative'}`}>
      {/* Presentation Display */}
      <div className="relative w-full aspect-video bg-white rounded-lg overflow-hidden shadow-2xl">
        <SlideRenderer slide={slide} />

        {/* Slide Counter */}
        <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1.5 rounded text-sm font-medium">
          {currentSlide + 1} / {totalSlides}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={prevSlide}
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={togglePlayPause}
          >
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Play
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={nextSlide}
            disabled={currentSlide === totalSlides - 1}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="flex-1 max-w-md min-w-[200px]">
          <div className="flex gap-1">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 flex-1 rounded-full transition-colors cursor-pointer ${
                  index < currentSlide
                    ? 'bg-blue-600'
                    : index === currentSlide
                    ? 'bg-blue-400'
                    : 'bg-gray-300'
                }`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>

        {/* Fullscreen */}
        <Button
          size="sm"
          variant="outline"
          onClick={toggleFullscreen}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Slide Renderer Component
function SlideRenderer({ slide }: { slide: PresentationSlide }) {
  const backgrounds = {
    'gradient-blue': 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700',
    'gradient-purple': 'bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700',
    'gradient-green': 'bg-gradient-to-br from-green-500 via-green-600 to-green-700',
    'dark': 'bg-gradient-to-br from-gray-800 to-gray-900',
    'light': 'bg-gradient-to-br from-gray-50 to-gray-100',
  };

  const bgClass = backgrounds[slide.background as keyof typeof backgrounds] || backgrounds['gradient-blue'];
  const textColor = slide.background === 'light' ? 'text-gray-900' : 'text-white';

  return (
    <div className={`w-full h-full flex flex-col items-center justify-center p-8 md:p-12 ${bgClass} ${textColor}`}>
      {/* Title Slide */}
      {slide.type === 'title' && (
        <div className="text-center space-y-6 animate-fade-in max-w-5xl">
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            {slide.title}
          </h1>
          {slide.subtitle && (
            <p className="text-2xl md:text-3xl font-light opacity-90">
              {slide.subtitle}
            </p>
          )}
        </div>
      )}

      {/* Definition Slide */}
      {slide.type === 'definition' && (
        <div className="text-center space-y-8 max-w-4xl animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold text-blue-300">
            {slide.title}
          </h2>
          <p className="text-2xl md:text-3xl leading-relaxed font-light">
            {slide.content}
          </p>
        </div>
      )}

      {/* Concept Slide */}
      {slide.type === 'concept' && (
        <div className="space-y-8 max-w-5xl animate-fade-in">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            {slide.title}
          </h2>
          <p className="text-2xl md:text-3xl leading-relaxed">
            {slide.content}
          </p>
        </div>
      )}

      {/* Bullet Points Slide */}
      {slide.type === 'bullet-points' && (
        <div className="space-y-8 max-w-5xl w-full animate-slide-up">
          <h2 className="text-3xl md:text-5xl font-bold mb-8">
            {slide.title}
          </h2>
          <ul className="space-y-4 md:space-y-6">
            {slide.points?.map((point, index) => (
              <li
                key={index}
                className="flex items-start gap-3 md:gap-4 text-xl md:text-2xl animate-fade-in"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <span className="text-3xl md:text-4xl font-bold text-blue-300 flex-shrink-0">•</span>
                <span className="flex-1 leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Equation Slide */}
      {slide.type === 'equation' && (
        <div className="text-center space-y-8 animate-fade-in max-w-4xl">
          {slide.title && (
            <h2 className="text-4xl md:text-5xl font-bold mb-8">
              {slide.title}
            </h2>
          )}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 md:p-12 border-2 border-white/20">
            <p className="text-3xl md:text-5xl font-mono font-bold tracking-wide break-words">
              {slide.equation}
            </p>
          </div>
          {slide.content && (
            <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto">
              {slide.content}
            </p>
          )}
        </div>
      )}

      {/* Comparison Slide */}
      {slide.type === 'comparison' && (
        <div className="w-full max-w-6xl animate-fade-in">
          <h2 className="text-3xl md:text-5xl font-bold mb-8 text-center">
            {slide.title}
          </h2>
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {/* Left Column */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 md:p-8 border-2 border-white/20">
              <h3 className="text-2xl md:text-3xl font-bold mb-4 text-blue-300">
                {slide.leftTitle || 'Left'}
              </h3>
              <ul className="space-y-3">
                {slide.leftContent?.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-lg md:text-xl">
                    <span className="text-blue-300 flex-shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Right Column */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 md:p-8 border-2 border-white/20">
              <h3 className="text-2xl md:text-3xl font-bold mb-4 text-purple-300">
                {slide.rightTitle || 'Right'}
              </h3>
              <ul className="space-y-3">
                {slide.rightContent?.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-lg md:text-xl">
                    <span className="text-purple-300 flex-shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Summary Slide */}
      {slide.type === 'summary' && (
        <div className="space-y-8 max-w-5xl w-full animate-fade-in">
          <h2 className="text-4xl md:text-6xl font-bold mb-8 text-center">
            {slide.title}
          </h2>
          {slide.content && (
            <p className="text-xl md:text-xl text-center mb-6 opacity-90">
              {slide.content}
            </p>
          )}
          {slide.points && slide.points.length > 0 && (
            <ul className="space-y-4">
              {slide.points.map((point, index) => (
                <li key={index} className="flex items-start gap-3 text-xl md:text-2xl">
                  <span className="text-2xl md:text-3xl text-green-300 flex-shrink-0">✓</span>
                  <span className="leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
