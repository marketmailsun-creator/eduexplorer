'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Diagram {
  id: number;
  title: string;
  type: string;
  description: string;
  imageUrl?: string;
  mermaidCode?: string;
}

interface DiagramViewerProps {
  diagrams: Diagram[];
}

export function DiagramViewer({ diagrams }: DiagramViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!diagrams || diagrams.length === 0) {
    return null;
  }

  const currentDiagram = diagrams[currentIndex];

  const nextDiagram = () => {
    if (currentIndex < diagrams.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const prevDiagram = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  return (
    <div className="space-y-4">
      {/* Diagram Display */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Title */}
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">{currentDiagram.title}</h3>
              <span className="text-sm text-muted-foreground px-3 py-1 bg-blue-50 rounded-full">
                {currentDiagram.type}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground">
              {currentDiagram.description}
            </p>

            {/* Diagram Image */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
              {currentDiagram.imageUrl ? (
                <img
                  src={currentDiagram.imageUrl}
                  alt={currentDiagram.title}
                  className="max-w-full h-auto"
                  onError={(e) => {
                    // Fallback if image fails to load
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = `<div class="text-center text-gray-500">
                        <p class="text-lg font-semibold mb-2">${currentDiagram.title}</p>
                        <p class="text-sm">${currentDiagram.description}</p>
                        <pre class="mt-4 text-xs text-left bg-gray-50 p-4 rounded overflow-x-auto">${currentDiagram.mermaidCode || 'Diagram loading...'}</pre>
                      </div>`;
                    }
                  }}
                />
              ) : currentDiagram.mermaidCode ? (
                <div className="text-center text-gray-600 max-w-2xl">
                  <p className="text-lg font-semibold mb-2">{currentDiagram.title}</p>
                  <p className="text-sm mb-4">{currentDiagram.description}</p>
                  <pre className="text-xs text-left bg-gray-50 p-4 rounded overflow-x-auto border">
                    {currentDiagram.mermaidCode}
                  </pre>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <p>Diagram visualization not available</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      {diagrams.length > 1 && (
        <div className="flex items-center justify-between">
          <Button
            size="sm"
            variant="outline"
            onClick={prevDiagram}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {diagrams.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-8 bg-blue-600'
                    : 'w-2 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to diagram ${index + 1}`}
              />
            ))}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={nextDiagram}
            disabled={currentIndex === diagrams.length - 1}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      <p className="text-xs text-center text-muted-foreground">
        Diagram {currentIndex + 1} of {diagrams.length}
      </p>
    </div>
  );
}

/**
 * Grid view - Shows all diagrams at once (alternative layout)
 */
export function DiagramGrid({ diagrams }: DiagramViewerProps) {
  if (!diagrams || diagrams.length === 0) {
    return null;
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {diagrams.map((diagram) => (
        <Card key={diagram.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">{diagram.title}</h4>
                <span className="text-xs px-2 py-1 bg-blue-50 rounded">
                  {diagram.type}
                </span>
              </div>
              
              <p className="text-xs text-muted-foreground">
                {diagram.description}
              </p>

              <div className="bg-white border rounded p-4 min-h-[200px] flex items-center justify-center">
                {diagram.imageUrl ? (
                  <img
                    src={diagram.imageUrl}
                    alt={diagram.title}
                    className="max-w-full h-auto"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="text-xs text-gray-400 text-center">
                    {diagram.mermaidCode ? (
                      <pre className="text-left overflow-x-auto">
                        {diagram.mermaidCode.substring(0, 100)}...
                      </pre>
                    ) : (
                      'Diagram not available'
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
