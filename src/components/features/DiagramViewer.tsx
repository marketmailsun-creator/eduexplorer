'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2, ZoomIn, ZoomOut, RotateCcw, RefreshCw } from 'lucide-react';
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

// Module-level counter for unique element IDs (avoids Date.now() collisions under rapid navigation)
let renderCounter = 0;

// Singleton module load — initialises mermaid once then caches the instance
let mermaidMod: any = null;
async function loadMermaid() {
  if (!mermaidMod) {
    const mod = await import('mermaid');
    mermaidMod = mod.default;
    // Initialise exactly once; re-calling initialize() on every render
    // triggers a DOM re-scan in mermaid v11 and worsens orphan elements.
    mermaidMod.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontSize: 14,
      flowchart: { useMaxWidth: true, htmlLabels: true },
      mindmap: { useMaxWidth: true },
    });
  }
  return mermaidMod;
}

// Returns the cached, already-initialised mermaid instance
async function getMermaid() {
  return loadMermaid();
}

/**
 * Remove any DOM elements that mermaid v11 may have appended to document.body
 * during rendering (the temporary sandbox div + any error message elements).
 */
function cleanupMermaidOrphans(elementId: string) {
  if (typeof document === 'undefined') return;
  // Mermaid creates a sandbox element: div#d{elementId}
  document.getElementById(`d${elementId}`)?.remove();
  // Also sweep any lingering mermaid error/render artefacts on the body
  document.querySelectorAll(
    `#${elementId}, [id^="mermaid-"], .mermaid-error`
  ).forEach(el => {
    // Only remove if it's a direct child of body (i.e. an orphan, not inside our container)
    if (el.parentElement === document.body) el.remove();
  });
}

export function DiagramViewer({ diagrams }: DiagramViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [svgs, setSvgs] = useState<Map<number, string>>(new Map());
  const [errorIds, setErrorIds] = useState<Set<number>>(new Set());
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());
  const [zoomScale, setZoomScale] = useState(1);
  const [retryCount, setRetryCount] = useState(0);

  if (!diagrams || diagrams.length === 0) {
    return null;
  }

  const currentDiagram = diagrams[currentIndex];

  const renderDiagram = useCallback(async (diagram: Diagram) => {
    if (!diagram.mermaidCode || svgs.has(diagram.id) || errorIds.has(diagram.id)) return;

    setLoadingIds(prev => new Set(prev).add(diagram.id));
    // Declare elementId before try so it is accessible in finally for cleanup
    const elementId = `mermaid-diagram-${++renderCounter}`;
    cleanupMermaidOrphans(elementId);
    try {
      const mermaid = await getMermaid();
      // Belt-and-suspenders: sanitize special chars inside [...] labels client-side too
      // Use quoted labels ["text"] which allow any content including () and {}
      let codeToRender = diagram.mermaidCode;
      codeToRender = codeToRender.replace(/\[([^\]]*)\]/g, (_match: string, inner: string) => {
        const escaped = inner.replace(/"/g, "'").replace(/`/g, "'");
        if (/[(){}|<>]/.test(escaped)) {
          return `["${escaped}"]`;
        }
        return `[${escaped}]`;
      });
      const { svg } = await mermaid.render(elementId, codeToRender);
      setSvgs(prev => new Map(prev).set(diagram.id, svg));
    } catch (err) {
      console.error('Mermaid render error:', diagram.title, err);
      setErrorIds(prev => new Set(prev).add(diagram.id));
    } finally {
      cleanupMermaidOrphans(elementId);
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(diagram.id);
        return next;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svgs, errorIds]);

  useEffect(() => {
    renderDiagram(currentDiagram);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, retryCount]);

  const nextDiagram = () => {
    if (currentIndex < diagrams.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setZoomScale(1);
    }
  };

  const prevDiagram = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setZoomScale(1);
    }
  };

  const zoomIn = () => setZoomScale(prev => Math.min(prev + 0.25, 3));
  const zoomOut = () => setZoomScale(prev => Math.max(prev - 0.25, 0.5));
  const resetZoom = () => setZoomScale(1);

  const handleRetry = () => {
    const diagramId = currentDiagram.id;
    setErrorIds(prev => { const next = new Set(prev); next.delete(diagramId); return next; });
    setSvgs(prev => { const next = new Map(prev); next.delete(diagramId); return next; });
    setLoadingIds(prev => { const next = new Set(prev); next.delete(diagramId); return next; });
    setRetryCount(c => c + 1);
  };

  const renderedSvg = svgs.get(currentDiagram.id);
  const isLoading = loadingIds.has(currentDiagram.id) || (!renderedSvg && !errorIds.has(currentDiagram.id) && !!currentDiagram.mermaidCode);
  const hasError = errorIds.has(currentDiagram.id);

  const DIAGRAM_TYPE_EMOJI: Record<string, string> = {
    flowchart: '🔀',
    cycle: '🔄',
    hierarchy: '🏗️',
    comparison: '⚖️',
    timeline: '📅',
    process: '⚙️',
    'concept-map': '🧠',
    mindmap: '🧠',
    sequence: '📋',
  };
  const typeEmoji = DIAGRAM_TYPE_EMOJI[currentDiagram.type?.toLowerCase()] ?? '📊';

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Diagram Display */}
      <Card className="overflow-hidden shadow-md">
        {/* Gradient header strip */}
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl flex-shrink-0">{typeEmoji}</span>
            <h3 className="text-white font-semibold text-sm sm:text-base truncate">
              {currentDiagram.title}
            </h3>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Zoom controls */}
            <button
              onClick={zoomOut}
              disabled={zoomScale <= 0.5}
              className="p-1.5 rounded-md bg-white/20 hover:bg-white/30 disabled:opacity-40 transition-colors"
              title="Zoom out"
              type="button"
            >
              <ZoomOut className="h-3.5 w-3.5 text-white" />
            </button>
            <span className="text-xs text-white/90 font-medium min-w-[36px] text-center">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              disabled={zoomScale >= 3}
              className="p-1.5 rounded-md bg-white/20 hover:bg-white/30 disabled:opacity-40 transition-colors"
              title="Zoom in"
              type="button"
            >
              <ZoomIn className="h-3.5 w-3.5 text-white" />
            </button>
            {zoomScale !== 1 && (
              <button
                onClick={resetZoom}
                className="p-1.5 rounded-md bg-white/20 hover:bg-white/30 transition-colors"
                title="Reset zoom"
                type="button"
              >
                <RotateCcw className="h-3.5 w-3.5 text-white" />
              </button>
            )}
            <span className="text-xs text-white/80 bg-white/20 px-2 py-0.5 rounded-full capitalize ml-1">
              {currentDiagram.type}
            </span>
          </div>
        </div>

        <CardContent className="p-3 sm:p-4 md:p-6">
          <div className="space-y-3 sm:space-y-4">
            {/* Description */}
            <p className="text-xs sm:text-sm text-muted-foreground">
              {currentDiagram.description}
            </p>

            {/* Diagram SVG */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-indigo-100 rounded-xl overflow-auto flex items-center justify-center min-h-[200px] sm:min-h-[250px] md:min-h-[300px] lg:min-h-[400px] p-3">
              {isLoading ? (
                <div className="text-center">
                  <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 animate-spin text-purple-600 mx-auto" />
                  <p className="text-xs text-gray-400 mt-2">Rendering diagram…</p>
                </div>
              ) : hasError ? (
                <div className="text-center space-y-3 p-6">
                  <p className="text-sm text-gray-500">Failed to render diagram</p>
                  <button
                    onClick={handleRetry}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors mx-auto"
                    type="button"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Retry
                  </button>
                  {currentDiagram.mermaidCode && (
                    <details className="text-left mt-2">
                      <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">Show diagram code</summary>
                      <pre className="text-xs bg-gray-50 p-3 rounded mt-2 overflow-auto max-h-40 text-left">{currentDiagram.mermaidCode}</pre>
                    </details>
                  )}
                </div>
              ) : renderedSvg ? (
                <div
                  style={{
                    transform: `scale(${zoomScale})`,
                    transformOrigin: 'top center',
                    transition: 'transform 0.2s ease',
                    width: '100%',
                  }}
                  dangerouslySetInnerHTML={{ __html: renderedSvg }}
                />
              ) : (
                <div className="text-center p-6">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">Preparing diagram…</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <Button
          onClick={prevDiagram}
          disabled={currentIndex === 0}
          variant="outline"
          size="sm"
          className="text-xs sm:text-sm"
        >
          <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          Previous
        </Button>

        <span className="text-xs sm:text-sm text-muted-foreground">
          Diagram {currentIndex + 1} of {diagrams.length}
        </span>

        <Button
          onClick={nextDiagram}
          disabled={currentIndex === diagrams.length - 1}
          variant="outline"
          size="sm"
          className="text-xs sm:text-sm"
        >
          Next
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Static SVG diagram generator (fallback utility — kept for compatibility)
 */
export function generateSimpleSVG(
  title: string,
  nodes: Array<{ label: string; x: number; y: number }>,
  links: Array<{ from: number; to: number }>
): string {
  const width = 800;
  const height = 400;

  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect width="${width}" height="${height}" fill="#f8fafc"/>`;

  links.forEach(link => {
    const from = nodes[link.from];
    const to = nodes[link.to];
    if (from && to) {
      svg += `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="#64748b" stroke-width="2" marker-end="url(#arrowhead)"/>`;
    }
  });

  svg += `<defs><marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><polygon points="0 0, 10 3, 0 6" fill="#64748b"/></marker></defs>`;

  nodes.forEach((node, index) => {
    const color = index === 0 ? '#60a5fa' : '#4ade80';
    svg += `<rect x="${node.x - 60}" y="${node.y - 20}" width="120" height="40" fill="${color}" rx="8" stroke="white" stroke-width="2"/>`;
    svg += `<text x="${node.x}" y="${node.y + 5}" text-anchor="middle" fill="white" font-size="14" font-weight="bold">${node.label}</text>`;
  });

  svg += '</svg>';
  return svg;
}
