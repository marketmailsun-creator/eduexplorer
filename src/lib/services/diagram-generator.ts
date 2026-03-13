import { GoogleGenerativeAI } from '@google/generative-ai';
import { incrementUsageCounter, sendQuotaAlertOnce } from '../db/redis';

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
 * Sanitize mermaid code to prevent parser failures.
 * Wraps node labels containing special characters in double-quoted strings.
 * Mermaid supports ["quoted label"] which allows any text content including
 * () and {} that would otherwise be interpreted as shape tokens.
 */
function sanitizeMermaidCode(code: string): string {
  if (!code) return code;
  // Wrap labels containing special mermaid characters in double-quoted strings.
  let result = code.replace(/\[([^\]]*)\]/g, (_match: string, inner: string) => {
    // Already a valid quoted label ["..."]: leave as-is to avoid corrupting it
    if (inner.startsWith('"') && inner.endsWith('"') && inner.length >= 2) {
      return `[${inner}]`;
    }
    const escaped = inner.replace(/"/g, "'").replace(/`/g, "'");
    if (/[(){}|<>]/.test(escaped)) {
      return `["${escaped}"]`;
    }
    return `[${escaped}]`;
  });
  // Also clean parenthetical node labels without brackets: node(text) where text has nested parens
  result = result.replace(/\(([^)]*)\)/g, (match: string, inner: string) => {
    if (inner.includes('(') || inner.includes(')')) {
      return `(${inner.replace(/\(/g, '{').replace(/\)/g, '}')})`;
    }
    return match;
  });
  return result;
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

  const prompt = `Create ${count} educational diagrams about "${topic}".

Content to base diagrams on:
${articleText.substring(0, 3000)}

IMPORTANT: Keep diagrams medium complexity (10 nodes max) for clear rendering.

For each diagram, provide:
1. Title (short, clear)
2. Type (flowchart, cycle, hierarchy, comparison, process, concept-map)
3. Description (one sentence)
4. Mermaid code (correct syntax for the type)

CRITICAL — For type "concept-map", use Mermaid MINDMAP syntax:
mindmap
  root((Main Topic))
    Category A
      Subconcept 1
      Subconcept 2
    Category B
      Subconcept 3
        Detail
    Category C
      Subconcept 4

Mindmap rules:
- Start with "mindmap" keyword (no graph TD)
- Use root((Topic)) for the centre node
- Indent with 2 spaces per level (max 3 levels)
- Include 3-5 top-level branches
- Each branch = a key concept or category (2-4 words)

For all other types use standard graph syntax:
- Use simple node IDs: A, B, C, D, E
- Keep labels SHORT (1-3 words)
- Use --> for flow arrows

Example flowchart:
graph TD
    A[Start] --> B[Step 1]
    B --> C[Step 2]
    C --> D[End]

Example concept-map (MINDMAP only):
mindmap
  root((Photosynthesis))
    Inputs
      Sunlight
      Water
      CO2
    Outputs
      Glucose
      Oxygen
    Location
      Chloroplast
      Leaves

Return ONLY valid JSON:
{
  "diagrams": [
    {
      "id": 1,
      "title": "Key Concepts",
      "type": "concept-map",
      "description": "Core concepts and relationships",
      "mermaidCode": "mindmap\\n  root((${topic.substring(0, 20)}))\\n    Category A\\n      Detail 1\\n      Detail 2\\n    Category B\\n      Detail 3\\n    Category C\\n      Detail 4"
    },
    {
      "id": 2,
      "title": "Main Process",
      "type": "process",
      "description": "Shows the basic flow",
      "mermaidCode": "graph TD\\n    A[Input] --> B[Process]\\n    B --> C[Output]"
    }
  ]
}

Generate ${count} diagrams now (include at least one concept-map using mindmap syntax):`;

  try {
    await incrementUsageCounter('gemini');
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

    // Sanitize all diagram codes before returning
    diagrams.forEach(d => {
      if (d.mermaidCode) d.mermaidCode = sanitizeMermaidCode(d.mermaidCode);
    });
    return diagrams;
  } catch (error: any) {
    console.error('❌ Diagram generation error:', error.message);
    await sendQuotaAlertOnce('gemini', `Gemini diagram generation failed.\nError: ${error.message}`);
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

  // Diagram 1: Main Concept Overview (mindmap)
  if (count >= 1) {
    const t0 = (keyTerms[0] || 'Aspect 1').substring(0, 15);
    const t1 = (keyTerms[1] || 'Aspect 2').substring(0, 15);
    const t2 = (keyTerms[2] || 'Aspect 3').substring(0, 15);
    const t3 = (keyTerms[3] || 'Detail A').substring(0, 15);
    const t4 = (keyTerms[4] || 'Detail B').substring(0, 15);
    const topicShort = topic.substring(0, 20);
    diagrams.push({
      id: 1,
      title: `${topic} Concept Map`,
      type: 'concept-map',
      description: 'Core concepts and their relationships',
      mermaidCode: `mindmap\n  root((${topicShort}))\n    Key Concepts\n      ${t0}\n      ${t1}\n    Applications\n      ${t2}\n      ${t3}\n    Related Topics\n      ${t4}\n      Extensions`,
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

  // Sanitize all diagram codes before returning
  diagrams.forEach(d => {
    if (d.mermaidCode) d.mermaidCode = sanitizeMermaidCode(d.mermaidCode);
  });
  console.log(`✅ Generated ${diagrams.length} template diagrams`);
  return diagrams;
}
