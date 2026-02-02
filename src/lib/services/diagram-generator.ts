import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const genAI = GOOGLE_API_KEY ? new GoogleGenerativeAI(GOOGLE_API_KEY) : null;

export interface Diagram {
  id: number;
  title: string;
  type: 'flowchart' | 'cycle' | 'hierarchy' | 'comparison' | 'timeline' | 'process' | 'venn' | 'concept-map';
  description: string;
  mermaidCode?: string;
  imageUrl?: string;
  svgContent?: string;
}

/**
 * Generate educational diagrams from content
 */
export async function generateDiagrams(
  topic: string,
  articleText: string,
  count: number = 3
): Promise<Diagram[]> {
  
  if (!genAI) {
    console.warn('⚠️ GOOGLE_API_KEY not set, using fallback diagrams');
    return generateFallbackDiagrams(topic, count);
  }

  console.log('═══════════════════════════════════════════════');
  console.log('📊 GENERATING DIAGRAMS');
  console.log('═══════════════════════════════════════════════');
  console.log(`Topic: ${topic}`);
  console.log(`Count: ${count}`);

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `Create ${count} educational diagrams about "${topic}".

Content to base diagrams on:
${articleText.substring(0, 3000)}

For each diagram, provide:
1. Title (concise)
2. Type (flowchart, cycle, hierarchy, comparison, timeline, process, venn, concept-map)
3. Description (what the diagram shows)
4. Mermaid code (simple, valid Mermaid.js syntax)

Mermaid diagram types:
- flowchart: Use "graph TD" or "graph LR"
- cycle: Use "graph TD" with circular connections
- hierarchy: Use "graph TD" with tree structure
- comparison: Use "graph LR" with parallel branches
- timeline: Use "graph LR" with sequential nodes
- process: Use "graph TD" with step-by-step flow
- venn: Use "graph TD" with overlapping concepts
- concept-map: Use "graph TD" with interconnected ideas

Keep diagrams SIMPLE (4-8 nodes max).

Return ONLY valid JSON:
{
  "diagrams": [
    {
      "id": 1,
      "title": "Photosynthesis Process",
      "type": "process",
      "description": "Shows the step-by-step process of photosynthesis",
      "mermaidCode": "graph TD\\n    A[Sunlight] --> B[Chlorophyll]\\n    C[Water] --> B\\n    D[CO2] --> B\\n    B --> E[Glucose]\\n    B --> F[Oxygen]"
    },
    {
      "id": 2,
      "title": "Energy Flow",
      "type": "flowchart",
      "description": "How energy flows through the process",
      "mermaidCode": "graph LR\\n    A[Light Energy] --> B[Chemical Energy]\\n    B --> C[Stored in Glucose]"
    }
  ]
}

Generate ${count} diagrams now:`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('⚠️ No JSON found, using fallback');
      return generateFallbackDiagrams(topic, count);
    }

    const data = JSON.parse(jsonMatch[0]);
    const diagrams: Diagram[] = data.diagrams || [];

    // Generate Mermaid chart URLs
    for (const diagram of diagrams) {
      if (diagram.mermaidCode) {
        // Use Mermaid.ink API (free, public)
        const encodedCode = encodeURIComponent(diagram.mermaidCode);
        diagram.imageUrl = `https://mermaid.ink/img/${btoa(diagram.mermaidCode)}`;
      }
    }

    console.log(`✅ Generated ${diagrams.length} diagrams`);
    diagrams.forEach(d => {
      console.log(`  - ${d.title} (${d.type})`);
    });

    return diagrams;
  } catch (error: any) {
    console.error('❌ Diagram generation error:', error.message);
    return generateFallbackDiagrams(topic, count);
  }
}

/**
 * Fallback: Generate simple text-based diagrams
 */
function generateFallbackDiagrams(topic: string, count: number): Diagram[] {
  const diagrams: Diagram[] = [
    {
      id: 1,
      title: `${topic} - Overview`,
      type: 'concept-map',
      description: 'Main concepts and relationships',
      mermaidCode: `graph TD
    A[${topic}] --> B[Key Concept 1]
    A --> C[Key Concept 2]
    A --> D[Key Concept 3]
    B --> E[Detail]
    C --> F[Detail]
    D --> G[Detail]`,
      imageUrl: '',
    },
    {
      id: 2,
      title: `${topic} - Process Flow`,
      type: 'flowchart',
      description: 'Step-by-step process',
      mermaidCode: `graph LR
    A[Start] --> B[Step 1]
    B --> C[Step 2]
    C --> D[Step 3]
    D --> E[End]`,
      imageUrl: '',
    },
    {
      id: 3,
      title: `${topic} - Cycle`,
      type: 'cycle',
      description: 'Cyclical process',
      mermaidCode: `graph TD
    A[Stage 1] --> B[Stage 2]
    B --> C[Stage 3]
    C --> D[Stage 4]
    D --> A`,
      imageUrl: '',
    },
  ];

  // Generate Mermaid URLs
  for (const diagram of diagrams.slice(0, count)) {
    if (diagram.mermaidCode) {
      diagram.imageUrl = `https://mermaid.ink/img/${btoa(diagram.mermaidCode)}`;
    }
  }

  return diagrams.slice(0, count);
}

/**
 * Common diagram templates for different subjects
 */
export const DIAGRAM_TEMPLATES = {
  biology: {
    cellStructure: `graph TD
    A[Cell] --> B[Nucleus]
    A --> C[Cytoplasm]
    A --> D[Cell Membrane]
    B --> E[DNA]
    C --> F[Organelles]`,
    
    foodChain: `graph LR
    A[Sun] --> B[Plants]
    B --> C[Herbivores]
    C --> D[Carnivores]
    D --> E[Decomposers]`,
  },
  
  chemistry: {
    reaction: `graph LR
    A[Reactants] --> B[Reaction]
    B --> C[Products]
    B --> D[Energy]`,
    
    atomStructure: `graph TD
    A[Atom] --> B[Nucleus]
    A --> C[Electrons]
    B --> D[Protons]
    B --> E[Neutrons]`,
  },
  
  physics: {
    energy: `graph TD
    A[Energy] --> B[Kinetic]
    A --> C[Potential]
    B --> D[Motion]
    C --> E[Position]`,
    
    forces: `graph LR
    A[Force Applied] --> B[Motion]
    B --> C[Acceleration]
    C --> D[Velocity Change]`,
  },
  
  math: {
    equation: `graph LR
    A[Given] --> B[Solve for X]
    B --> C[Isolate Variable]
    C --> D[Solution]`,
  },
  
  history: {
    timeline: `graph LR
    A[Event 1] --> B[Event 2]
    B --> C[Event 3]
    C --> D[Event 4]`,
    
    causeEffect: `graph TD
    A[Cause] --> B[Effect 1]
    A --> C[Effect 2]
    A --> D[Effect 3]`,
  },
};
