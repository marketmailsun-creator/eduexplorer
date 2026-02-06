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

function ensureArray(content: any): string[] {
  if (!content) return [];
  if (Array.isArray(content)) return content;
  if (typeof content === 'string') return [content];
  if (typeof content === 'object') {
    if (content.text) return [content.text];
    if (content.items && Array.isArray(content.items)) return content.items;
  }
  return [];
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
        <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 bg-black/50 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs sm:text-sm font-medium">
          {currentSlide + 1} / {totalSlides}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-3 sm:mt-4 flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
        {/* Navigation */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="text-xs sm:text-sm h-8 sm:h-9"
          >
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Previous</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={togglePlayPause}
            className="text-xs sm:text-sm h-8 sm:h-9"
          >
            {isPlaying ? (
              <>
                <Pause className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Pause</span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Play</span>
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={nextSlide}
            disabled={currentSlide === totalSlides - 1}
            className="text-xs sm:text-sm h-8 sm:h-9"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="flex-1 max-w-md min-w-[150px] sm:min-w-[200px]">
          <div className="flex gap-0.5 sm:gap-1">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`h-1 sm:h-1.5 flex-1 rounded-full transition-colors cursor-pointer ${
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
          className="h-8 sm:h-9 px-2 sm:px-3"
        >
          <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </div>
    </div>
  );
}

// Slide Renderer Component - ULTRA COMPACT FOR MOBILE
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
    <div className={`w-full h-full flex flex-col items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12 ${bgClass} ${textColor}`}>
      {/* Title Slide - MUCH SMALLER */}
      {slide.type === 'title' && (
        <div className="text-center space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6 animate-fade-in max-w-5xl">
          <h1 className="text-base sm:text-lg md:text-2xl lg:text-4xl xl:text-6xl font-bold leading-tight px-2">
            {slide.title}
          </h1>
          {slide.subtitle && (
            <p className="text-xs sm:text-sm md:text-base lg:text-xl xl:text-2xl font-light opacity-90 px-2">
              {slide.subtitle}
            </p>
          )}
        </div>
      )}

      {/* Definition Slide */}
      {slide.type === 'definition' && (
        <div className="text-center space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6 max-w-4xl animate-slide-up px-3">
          <h2 className="text-sm sm:text-base md:text-lg lg:text-2xl xl:text-3xl font-bold text-blue-300">
            {slide.title}
          </h2>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl leading-relaxed font-light">
            {slide.content}
          </p>
        </div>
      )}

      {/* Concept Slide */}
      {slide.type === 'concept' && (
        <div className="space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6 max-w-5xl animate-fade-in px-3">
          <h2 className="text-sm sm:text-base md:text-lg lg:text-2xl xl:text-3xl font-bold mb-2 sm:mb-3">
            {slide.title}
          </h2>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl leading-relaxed">
            {slide.content}
          </p>
        </div>
      )}

      {/* Bullet Points Slide - MOST COMPACT */}
      {slide.type === 'bullet-points' && (
        <div className="space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6 max-w-5xl w-full animate-slide-up px-3">
          <h2 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-3xl font-bold mb-2 sm:mb-3">
            {slide.title}
          </h2>
          <ul className="space-y-1 sm:space-y-1.5 md:space-y-2 lg:space-y-3">
            {ensureArray(slide.points).map((point, index) => (
              <li
                key={index}
                className="flex items-start gap-1.5 sm:gap-2 md:gap-2.5 text-xs sm:text-sm md:text-base lg:text-lg animate-fade-in"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <span className="text-blue-400 font-bold text-xs sm:text-sm md:text-base flex-shrink-0 mt-0.5">•</span>
                <span className="flex-1 leading-snug">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Equation Slide */}
      {slide.type === 'equation' && (
        <div className="text-center space-y-3 sm:space-y-4 md:space-y-6 animate-fade-in max-w-4xl px-3">
          {slide.title && (
            <h2 className="text-sm sm:text-base md:text-lg lg:text-2xl xl:text-3xl font-bold mb-3 sm:mb-4">
              {slide.title}
            </h2>
          )}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 border border-white/20">
            <p className="text-xs sm:text-sm md:text-base lg:text-xl xl:text-2xl font-mono font-bold tracking-wide break-words">
              {slide.equation}
            </p>
          </div>
          {slide.content && (
            <p className="text-xs sm:text-sm md:text-base lg:text-lg opacity-90 max-w-3xl mx-auto">
              {slide.content}
            </p>
          )}
        </div>
      )}

      {/* Comparison Slide */}
      {slide.type === 'comparison' && (
        <div className="w-full max-w-6xl animate-fade-in px-2 sm:px-3">
          <h2 className="text-sm sm:text-base md:text-lg lg:text-2xl xl:text-3xl font-bold mb-3 sm:mb-4 md:mb-6 text-center">
            {slide.title}
          </h2>
          <div className="grid md:grid-cols-2 gap-2 sm:gap-3 md:gap-6">
            {/* Left Column */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2.5 sm:p-3 md:p-6 border border-white/20">
              <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold mb-2 sm:mb-2.5 md:mb-3 text-blue-300">
                {slide.leftTitle || 'Left'}
              </h3>
              <ul className="space-y-1 sm:space-y-1.5 md:space-y-2">
                {ensureArray(slide.leftContent).map((item, index) => (
                  <li key={index} className="flex items-start gap-1.5 text-xs sm:text-sm md:text-base lg:text-lg">
                    <span className="text-blue-300 flex-shrink-0 text-xs">•</span>
                    <span className="leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Right Column */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2.5 sm:p-3 md:p-6 border border-white/20">
              <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold mb-2 sm:mb-2.5 md:mb-3 text-purple-300">
                {slide.rightTitle || 'Right'}
              </h3>
              <ul className="space-y-1 sm:space-y-1.5 md:space-y-2">
               {ensureArray(slide.rightContent).map((item, index) => (
                  <li key={index} className="flex items-start gap-1.5 text-xs sm:text-sm md:text-base lg:text-lg">
                    <span className="text-purple-300 flex-shrink-0 text-xs">•</span>
                    <span className="leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Summary Slide */}
      {slide.type === 'summary' && (
        <div className="space-y-3 sm:space-y-4 md:space-y-6 max-w-5xl w-full animate-fade-in px-3">
          <h2 className="text-base sm:text-lg md:text-xl lg:text-3xl xl:text-4xl font-bold mb-3 sm:mb-4 text-center">
            {slide.title}
          </h2>
          {slide.content && (
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-center mb-2 sm:mb-3 opacity-90">
              {slide.content}
            </p>
          )}
          {slide.points && slide.points.length > 0 && (
            <ul className="space-y-1.5 sm:space-y-2 md:space-y-3">
              {slide.points.map((point, index) => (
                <li key={index} className="flex items-start gap-2 text-xs sm:text-sm md:text-base lg:text-lg">
                  <span className="text-sm sm:text-base md:text-lg lg:text-xl text-green-300 flex-shrink-0">✓</span>
                  <span className="leading-snug">{point}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
