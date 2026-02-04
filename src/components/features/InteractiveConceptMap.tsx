'use client';

import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, X } from 'lucide-react';

interface ConceptNode {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
  category?: string;
}

interface ConceptLink {
  from: string;
  to: string;
  label?: string;
}

interface ConceptMapData {
  topic: string;
  nodes: ConceptNode[];
  links: ConceptLink[];
}

interface InteractiveConceptMap {
  data: ConceptMapData;
  articleText: string;
}

export function InteractiveConceptMapClickable({ data, articleText }: InteractiveConceptMap) {
  const [nodes, setNodes] = useState<ConceptNode[]>(data.nodes);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState<ConceptNode | null>(null);
  const [explanation, setExplanation] = useState<string>('');
  const canvasRef = useRef<HTMLDivElement>(null);

  // Extract relevant explanation for clicked concept
  const getExplanationForConcept = (concept: string): string => {
    // Split article into sentences
    const sentences = articleText
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20);

    // Find sentences that mention the concept
    const relevantSentences = sentences.filter(sentence =>
      sentence.toLowerCase().includes(concept.toLowerCase())
    );

    if (relevantSentences.length > 0) {
      // Return first 3 relevant sentences
      return relevantSentences.slice(0, 3).join('. ') + '.';
    }

    // Fallback: return first few sentences
    return sentences.slice(0, 3).join('. ') + '.';
  };

  const handleNodeClick = (node: ConceptNode) => {
    console.log('📍 Node clicked:', node.label);
    setSelectedNode(node);
    const nodeExplanation = getExplanationForConcept(node.label);
    setExplanation(nodeExplanation);
  };

  const closeExplanation = () => {
    setSelectedNode(null);
    setExplanation('');
  };

  const handleNodeDrag = (nodeId: string, deltaX: number, deltaY: number) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { ...node, x: node.x + deltaX / zoom, y: node.y + deltaY / zoom }
        : node
    ));
  };

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    setDraggedNode(nodeId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedNode) return;
    handleNodeDrag(draggedNode, e.movementX, e.movementY);
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
  const handleReset = () => {
    setNodes(data.nodes);
    setZoom(1);
    setSelectedNode(null);
    setExplanation('');
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Click nodes to see explanations • Drag to rearrange
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleZoomOut}>
            <ZoomOut className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleZoomIn}>
            <ZoomIn className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleReset}>
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div 
        ref={canvasRef}
        className="relative w-full bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 overflow-hidden cursor-move"
        style={{ height: '400px' }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
        >
          {/* Draw links */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#64748b" />
            </marker>
          </defs>
          
          {data.links.map((link, idx) => {
            const fromNode = nodes.find(n => n.id === link.from);
            const toNode = nodes.find(n => n.id === link.to);
            if (!fromNode || !toNode) return null;

            const isHighlighted = 
              selectedNode?.id === link.from || 
              selectedNode?.id === link.to;

            return (
              <line
                key={idx}
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke={isHighlighted ? '#3b82f6' : '#94a3b8'}
                strokeWidth={isHighlighted ? 3 : 2}
                markerEnd="url(#arrowhead)"
                opacity={isHighlighted ? 0.9 : 0.4}
              />
            );
          })}
        </svg>

        {/* Draw nodes */}
        {nodes.map(node => {
          const isSelected = selectedNode?.id === node.id;
          const isConnected = selectedNode && data.links.some(
            link => 
              (link.from === selectedNode.id && link.to === node.id) ||
              (link.to === selectedNode.id && link.from === node.id)
          );

          return (
            <div
              key={node.id}
              className={`absolute cursor-pointer transition-all duration-200 ${
                isSelected ? 'scale-110 z-20' : isConnected ? 'z-10' : 'z-0'
              }`}
              style={{
                left: `${node.x}px`,
                top: `${node.y}px`,
                transform: `translate(-50%, -50%) scale(${zoom})`,
                transformOrigin: 'center',
              }}
              onMouseDown={(e) => handleMouseDown(e, node.id)}
              onClick={(e) => {
                e.stopPropagation();
                handleNodeClick(node);
              }}
            >
              <div
                className={`px-4 py-2 rounded-full text-xs font-medium shadow-lg border-2 transition-all ${
                  isSelected 
                    ? 'border-blue-500 shadow-xl' 
                    : isConnected
                    ? 'border-blue-300'
                    : 'border-white'
                } hover:shadow-xl hover:scale-105`}
                style={{
                  backgroundColor: node.color,
                  color: '#1e293b',
                }}
              >
                {node.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Explanation Panel */}
      {selectedNode && explanation && (
        <Card className="border-l-4 border-blue-500 bg-blue-50/50 animate-in slide-in-from-bottom-4">
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                <span 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: selectedNode.color }}
                />
                {selectedNode.label}
              </h4>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={closeExplanation}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {explanation}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
