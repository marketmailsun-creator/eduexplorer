'use client';

import { useState, useMemo } from 'react';
import { Search, Zap, BookOpen, ArrowRight, X, Info } from 'lucide-react';

interface ConceptNode {
  id: string;
  label: string;
  description?: string;
  category?: string;
  relatedConcepts?: string[];
  snippet?: string;
}

interface ConceptMapData {
  nodes: ConceptNode[];
  mainTopic: string;
}

interface EnhancedConceptMapProps {
  data: ConceptMapData;
  articleText: string;
}

export function EnhancedConceptMap({ data, articleText }: EnhancedConceptMapProps) {
  const [selectedNode, setSelectedNode] = useState<ConceptNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Enhanced nodes with better snippets from article
  const enhancedNodes = useMemo(() => {
    return data.nodes.map(node => {
      // Find relevant snippet from article
      const snippet = extractRelevantSnippet(articleText, node.label);
      return {
        ...node,
        snippet: snippet || node.description || node.label,
      };
    });
  }, [data.nodes, articleText]);

  // Filter nodes based on search
  const filteredNodes = useMemo(() => {
    if (!searchQuery) return enhancedNodes;
    return enhancedNodes.filter(node =>
      node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.snippet?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [enhancedNodes, searchQuery]);

  // Group nodes by category
  const groupedNodes = useMemo(() => {
    const groups: Record<string, ConceptNode[]> = {};
    filteredNodes.forEach(node => {
      const category = node.category || 'General';
      if (!groups[category]) groups[category] = [];
      groups[category].push(node);
    });
    return groups;
  }, [filteredNodes]);

  const handleNodeClick = (node: ConceptNode) => {
    setSelectedNode(selectedNode?.id === node.id ? null : node);
  };

  return (
    <div className="space-y-4">
      {/* Header with Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search concepts..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Info className="h-4 w-4" />
          <span>Click cards to see details</span>
        </div>
      </div>

      {/* Main Topic */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3">
          <Zap className="h-8 w-8" />
          <div>
            <h3 className="text-2xl font-bold">{data.mainTopic}</h3>
            <p className="text-blue-100 text-sm mt-1">Main Topic - {enhancedNodes.length} key concepts</p>
          </div>
        </div>
      </div>

      {/* Concept Grid */}
      <div className="space-y-6">
        {Object.entries(groupedNodes).map(([category, nodes]) => (
          <div key={category}>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-blue-500"></div>
              {category}
              <span className="text-gray-400 text-xs">({nodes.length})</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {nodes.map((node) => (
                <button
                  key={node.id}
                  onClick={() => handleNodeClick(node)}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  className={`
                    relative p-4 rounded-lg border-2 text-left transition-all
                    ${selectedNode?.id === node.id
                      ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                      : hoveredNode === node.id
                      ? 'border-blue-300 bg-blue-25 shadow-md scale-102'
                      : 'border-gray-200 bg-white hover:border-blue-200 hover:shadow'
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="font-semibold text-gray-900 text-sm leading-tight">
                      {node.label}
                    </h5>
                    {selectedNode?.id === node.id && (
                      <X className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                  
                  {/* Preview snippet */}
                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                    {node.snippet}
                  </p>

                  {/* Related concepts indicator */}
                  {node.relatedConcepts && node.relatedConcepts.length > 0 && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-blue-600">
                      <ArrowRight className="h-3 w-3" />
                      <span>{node.relatedConcepts.length} related</span>
                    </div>
                  )}

                  {/* Selection indicator */}
                  {selectedNode?.id === node.id && (
                    <div className="absolute top-2 right-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Node Details Panel */}
      {selectedNode && (
        <div className="mt-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200 shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedNode.label}</h3>
                {selectedNode.category && (
                  <span className="text-sm text-blue-600">{selectedNode.category}</span>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Full snippet/description */}
          <div className="bg-white rounded-lg p-4 mb-4">
            <p className="text-gray-700 leading-relaxed">
              {selectedNode.snippet || selectedNode.description || 'No additional details available.'}
            </p>
          </div>

          {/* Related concepts */}
          {selectedNode.relatedConcepts && selectedNode.relatedConcepts.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-blue-500" />
                Related Concepts
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedNode.relatedConcepts.map((relatedId) => {
                  const relatedNode = enhancedNodes.find(n => n.id === relatedId);
                  if (!relatedNode) return null;
                  return (
                    <button
                      key={relatedId}
                      onClick={() => handleNodeClick(relatedNode)}
                      className="px-3 py-1.5 bg-white rounded-full text-sm font-medium text-blue-600 hover:bg-blue-100 transition-colors border border-blue-200"
                    >
                      {relatedNode.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {filteredNodes.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Search className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600">No concepts found matching "{searchQuery}"</p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-4 text-blue-600 hover:underline text-sm"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Learning Tips */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-yellow-900 mb-2 flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Learning Tips
        </h4>
        <ul className="text-xs text-yellow-800 space-y-1">
          <li>• Click on any concept card to see detailed explanation</li>
          <li>• Use search to find specific topics quickly</li>
          <li>• Explore related concepts to build connections</li>
          <li>• Review all concepts in a category systematically</li>
        </ul>
      </div>
    </div>
  );
}

// Helper function to extract relevant snippet from article
function extractRelevantSnippet(articleText: string, concept: string): string | null {
  if (!articleText || !concept) return null;

  const sentences = articleText.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20);
  
  // Find sentences that mention the concept
  const relevantSentences = sentences.filter(sentence => 
    sentence.toLowerCase().includes(concept.toLowerCase())
  );

  if (relevantSentences.length === 0) {
    // Try to find sentences with similar words
    const conceptWords = concept.toLowerCase().split(' ');
    const similarSentences = sentences.filter(sentence => 
      conceptWords.some(word => 
        word.length > 3 && sentence.toLowerCase().includes(word)
      )
    );
    
    if (similarSentences.length > 0) {
      return similarSentences[0].substring(0, 150) + (similarSentences[0].length > 150 ? '...' : '');
    }
    
    return null;
  }

  // Return the first relevant sentence (truncated if too long)
  const snippet = relevantSentences[0];
  return snippet.length > 150 ? snippet.substring(0, 150) + '...' : snippet;
}
