// Server-side utility for generating concept map data

export interface ConceptNode {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
  category?: string;
}

export interface ConceptLink {
  from: string;
  to: string;
  label?: string;
}

export interface ConceptMapData {
  topic: string;
  nodes: ConceptNode[];
  links: ConceptLink[];
}

/**
 * Generate concept map data from topic and key points
 * This is a pure function that can be called from server components
 */
export function generateConceptMapData(
  topic: string,
  keyPoints: string[]
): ConceptMapData {
  const centerX = 400;
  const centerY = 250;
  const radius = 150;

  const nodes: ConceptNode[] = [
    {
      id: 'center',
      label: topic.substring(0, 30), // Keep labels short
      x: centerX,
      y: centerY,
      color: '#60a5fa',
      category: 'main',
    },
  ];

  const links: ConceptLink[] = [];

  // Add key points in a circle
  keyPoints.forEach((point, index) => {
    const angle = (index / keyPoints.length) * 2 * Math.PI;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    const nodeId = `point-${index}`;
    
    // Alternate colors for visual variety
    const colors = ['#4ade80', '#a78bfa', '#fbbf24'];
    const color = colors[index % colors.length];

    nodes.push({
      id: nodeId,
      label: point.substring(0, 30), // Keep labels short
      x,
      y,
      color,
      category: 'key-point',
    });

    links.push({
      from: 'center',
      to: nodeId,
    });
  });

  return {
    topic,
    nodes,
    links,
  };
}

/**
 * Extract key points from article text
 */
export function extractKeyPoints(articleText: string, count: number = 6): string[] {
  const sentences = articleText
    .split(/[.!?]+/)
    .filter(s => s.trim().length > 20)
    .map(s => s.trim());

  return sentences
    .slice(0, count)
    .map(s => s.substring(0, 40)); // Keep short for display
}
