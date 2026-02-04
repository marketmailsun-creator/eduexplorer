import { GoogleGenerativeAI } from '@google/generative-ai';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const genAI = GOOGLE_API_KEY ? new GoogleGenerativeAI(GOOGLE_API_KEY) : null;

export interface Diagram {
  id: number;
  title: string;
  type: 'flowchart' | 'cycle' | 'hierarchy' | 'comparison' | 'timeline' | 'process' | 'concept-map';
  description: string;
  mermaidCode?: string;
  svgContent?: string;
}

/**
 * Generate educational diagrams with improved rendering
 */
export async function generateDiagrams(
  topic: string,
  articleText: string,
  count: number = 3
): Promise<Diagram[]> {
  
  if (!genAI) {
    console.warn('⚠️ GOOGLE_API_KEY not set, using template diagrams');
    return generateTemplateDiagrams(topic, articleText, count);
  }

  console.log('═══════════════════════════════════════════════');
  console.log('📊 GENERATING DIAGRAMS');
  console.log('═══════════════════════════════════════════════');
  console.log(`Topic: ${topic}`);
  console.log(`Count: ${count}`);

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `Create ${count} simple educational diagrams about "${topic}".

Content to base diagrams on:
${articleText.substring(0, 3000)}

IMPORTANT: Keep diagrams VERY SIMPLE (3-6 nodes max) for clear rendering.

For each diagram, provide:
1. Title (short, clear)
2. Type (flowchart, cycle, hierarchy, comparison, process, concept-map)
3. Description (one sentence)
4. Mermaid code (SIMPLE syntax, use clear labels)

Mermaid syntax rules:
- Use simple node IDs: A, B, C, D, E
- Keep labels SHORT (1-3 words)
- Use clear arrow types: --> for flow
- Avoid complex styling

Example GOOD diagram:
graph TD
    A[Start] --> B[Step 1]
    B --> C[Step 2]
    C --> D[End]

Example BAD (too complex):
graph TD
    A[This is a very long label that won't render well] --> B[Another long label]

Return ONLY valid JSON:
{
  "diagrams": [
    {
      "id": 1,
      "title": "Main Process",
      "type": "process",
      "description": "Shows the basic flow",
      "mermaidCode": "graph TD\\n    A[Input] --> B[Process]\\n    B --> C[Output]"
    },
    {
      "id": 2,
      "title": "Key Components",
      "type": "hierarchy",
      "description": "Main parts breakdown",
      "mermaidCode": "graph TD\\n    A[Main] --> B[Part 1]\\n    A --> C[Part 2]\\n    A --> D[Part 3]"
    }
  ]
}

Generate ${count} SIMPLE diagrams now:`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('⚠️ No JSON found, using templates');
      return generateTemplateDiagrams(topic, articleText, count);
    }

    const data = JSON.parse(jsonMatch[0]);
    const diagrams: Diagram[] = data.diagrams || [];

    console.log(`✅ Generated ${diagrams.length} diagrams`);
    diagrams.forEach(d => {
      console.log(`  - ${d.title} (${d.type})`);
    });

    return diagrams;
  } catch (error: any) {
    console.error('❌ Diagram generation error:', error.message);
    return generateTemplateDiagrams(topic, articleText, count);
  }
}

/**
 * Generate template-based diagrams (guaranteed to work)
 */
function generateTemplateDiagrams(topic: string, content: string, count: number): Diagram[] {
  // Extract key terms from content
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const words = content.split(/\s+/).filter(w => w.length > 5);
  const keyTerms = [...new Set(words.slice(0, 10))].slice(0, 6);

  const diagrams: Diagram[] = [];

  // Diagram 1: Main Concept Overview
  if (count >= 1) {
    diagrams.push({
      id: 1,
      title: `${topic} Overview`,
      type: 'concept-map',
      description: 'Main concept and key components',
      mermaidCode: `graph TD
    A[${topic}]
    A --> B[${keyTerms[0] || 'Aspect 1'}]
    A --> C[${keyTerms[1] || 'Aspect 2'}]
    A --> D[${keyTerms[2] || 'Aspect 3'}]`,
    });
  }

  // Diagram 2: Process Flow
  if (count >= 2) {
    diagrams.push({
      id: 2,
      title: 'Process Flow',
      type: 'flowchart',
      description: 'Step-by-step progression',
      mermaidCode: `graph LR
    A[Start] --> B[${keyTerms[3] || 'Step 1'}]
    B --> C[${keyTerms[4] || 'Step 2'}]
    C --> D[Result]`,
    });
  }

  // Diagram 3: Cycle/Loop
  if (count >= 3) {
    diagrams.push({
      id: 3,
      title: 'Key Cycle',
      type: 'cycle',
      description: 'Recurring process or cycle',
      mermaidCode: `graph TD
    A[Phase 1] --> B[Phase 2]
    B --> C[Phase 3]
    C --> A`,
    });
  }

  console.log(`✅ Generated ${diagrams.length} template diagrams`);
  return diagrams;
}
