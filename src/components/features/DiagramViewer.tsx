'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Diagram {
  id: number;
  title: string;
  type: string;
  description: string;
  mermaidCode?: string;
}

interface DiagramViewerProps {
  diagrams: Diagram[];
}

export function DiagramViewer({ diagrams }: DiagramViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [renderedDiagrams, setRenderedDiagrams] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(false);

  if (!diagrams || diagrams.length === 0) {
    return null;
  }

  const currentDiagram = diagrams[currentIndex];

  // Render Mermaid diagram using mermaid.ink API
  useEffect(() => {
    const renderDiagram = async () => {
      if (!currentDiagram.mermaidCode || renderedDiagrams.has(currentDiagram.id)) {
        return;
      }

      setLoading(true);
      try {
        // Use mermaid.ink API for rendering
        const encoded = btoa(currentDiagram.mermaidCode);
        const imageUrl = `https://mermaid.ink/img/${encoded}`;
        
        // Preload image to check if it works
        const img = new Image();
        img.onload = () => {
          setRenderedDiagrams(prev => new Map(prev).set(currentDiagram.id, imageUrl));
          setLoading(false);
        };
        img.onerror = () => {
          console.error('Failed to load diagram:', currentDiagram.title);
          setLoading(false);
        };
        img.src = imageUrl;
      } catch (error) {
        console.error('Error rendering diagram:', error);
        setLoading(false);
      }
    };

    renderDiagram();
  }, [currentDiagram, renderedDiagrams]);

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

  const renderedUrl = renderedDiagrams.get(currentDiagram.id);

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
            <div className="bg-white border-2 border-gray-200 rounded-lg p-8 flex items-center justify-center min-h-[400px]">
              {loading ? (
                <div className="flex flex-col items-center gap-4 text-gray-500">
                  <Loader2 className="h-12 w-12 animate-spin" />
                  <p>Rendering diagram...</p>
                </div>
              ) : renderedUrl ? (
                <img
                  src={renderedUrl}
                  alt={currentDiagram.title}
                  className="max-w-full h-auto"
                  style={{ maxHeight: '400px' }}
                />
              ) : currentDiagram.mermaidCode ? (
                <div className="w-full max-w-2xl">
                  <div className="bg-gray-50 border rounded-lg p-6">
                    <p className="text-sm font-semibold mb-3 text-gray-700">Diagram Code:</p>
                    <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap break-words">
                      {currentDiagram.mermaidCode}
                    </pre>
                  </div>
                  <p className="text-xs text-center text-gray-500 mt-4">
                    Visual rendering temporarily unavailable - showing code representation
                  </p>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <p>No diagram available</p>
                </div>
              )}
            </div>

            {/* Help Text */}
            <div className="text-xs text-center text-gray-500 bg-blue-50 p-3 rounded">
              💡 Tip: Diagrams show key concepts and their relationships visually
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
 * Static SVG diagram generator (fallback)
 */
export function generateSimpleSVG(
  title: string,
  nodes: Array<{ label: string; x: number; y: number }>,
  links: Array<{ from: number; to: number }>
): string {
  const width = 800;
  const height = 400;

  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
  
  // Background
  svg += `<rect width="${width}" height="${height}" fill="#f8fafc"/>`;
  
  // Draw links
  links.forEach(link => {
    const from = nodes[link.from];
    const to = nodes[link.to];
    if (from && to) {
      svg += `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="#64748b" stroke-width="2" marker-end="url(#arrowhead)"/>`;
    }
  });
  
  // Arrow marker
  svg += `<defs><marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><polygon points="0 0, 10 3, 0 6" fill="#64748b"/></marker></defs>`;
  
  // Draw nodes
  nodes.forEach((node, index) => {
    const color = index === 0 ? '#60a5fa' : '#4ade80';
    svg += `<rect x="${node.x - 60}" y="${node.y - 20}" width="120" height="40" fill="${color}" rx="8" stroke="white" stroke-width="2"/>`;
    svg += `<text x="${node.x}" y="${node.y + 5}" text-anchor="middle" fill="white" font-size="14" font-weight="bold">${node.label}</text>`;
  });
  
  svg += '</svg>';
  return svg;
}
