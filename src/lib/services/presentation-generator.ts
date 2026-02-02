import { GoogleGenerativeAI } from '@google/generative-ai';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const genAI = GOOGLE_API_KEY ? new GoogleGenerativeAI(GOOGLE_API_KEY) : null;

export interface PresentationSlide {
  id: number;
  type: 'title' | 'definition' | 'bullet-points' | 'equation' | 'comparison' | 'summary';
  title?: string;
  subtitle?: string;
  content?: string;
  points?: string[];
  equation?: string;
  leftColumn?: string[];
  rightColumn?: string[];
  background: 'gradient-blue' | 'gradient-purple' | 'dark' | 'light';
}

export interface Presentation {
  topic: string;
  level: string;
  totalSlides: number;
  slides: PresentationSlide[];
}

/**
 * Generate presentation slides from article content
 */
export async function generatePresentation(
  topic: string,
  articleText: string,
  level: string = 'college'
): Promise<Presentation> {
  if (!genAI) {
    throw new Error('GOOGLE_API_KEY not configured');
  }

  console.log('═══════════════════════════════════════════════');
  console.log('📊 GENERATING PRESENTATION');
  console.log('═══════════════════════════════════════════════');
  console.log(`Topic: ${topic}`);
  console.log(`Level: ${level}`);

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `Create an educational presentation about "${topic}" for ${level} level students.

Based on this content:
${articleText.substring(0, 4000)}

Generate 6-10 slides. Each slide should be clear and focused on ONE concept.

Slide types:
1. title - Opening slide with main topic
2. definition - Key term definition
3. bullet-points - List of key points (3-5 items)
4. equation - Mathematical/chemical equation
5. comparison - Compare two concepts (left vs right columns)
6. summary - Recap key takeaways

Return ONLY valid JSON in this EXACT format:
{
  "topic": "${topic}",
  "level": "${level}",
  "totalSlides": 8,
  "slides": [
    {
      "id": 1,
      "type": "title",
      "title": "Main Topic Title",
      "subtitle": "Brief engaging subtitle",
      "background": "gradient-blue"
    },
    {
      "id": 2,
      "type": "definition",
      "title": "Key Term",
      "content": "Clear, concise definition in one sentence",
      "background": "dark"
    },
    {
      "id": 3,
      "type": "bullet-points",
      "title": "Key Concepts",
      "points": ["Point 1", "Point 2", "Point 3"],
      "background": "light"
    },
    {
      "id": 4,
      "type": "equation",
      "title": "Important Equation",
      "equation": "E = mc²",
      "content": "Brief explanation of what it means",
      "background": "gradient-purple"
    },
    {
      "id": 5,
      "type": "summary",
      "title": "Key Takeaways",
      "points": ["Takeaway 1", "Takeaway 2", "Takeaway 3"],
      "background": "gradient-blue"
    }
  ]
}

Rules:
- Keep text SHORT (10-15 words per bullet point)
- One concept per slide
- Use simple, clear language
- Alternate background colors for visual interest

Generate the presentation JSON now:`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse presentation JSON');
    }

    const presentation: Presentation = JSON.parse(jsonMatch[0]);

    console.log(`✅ Generated ${presentation.totalSlides} slides`);
    presentation.slides.forEach(slide => {
      console.log(`  - Slide ${slide.id}: ${slide.type} - ${slide.title || 'No title'}`);
    });

    return presentation;
  } catch (error: any) {
    console.error('❌ Presentation generation failed:', error.message);
    throw error;
  }
}

/**
 * Fallback: Generate simple presentation if API fails
 */
export function generateFallbackPresentation(
  topic: string,
  articleText: string,
  level: string
): Presentation {
  // Extract first few sentences for summary
  const sentences = articleText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  return {
    topic,
    level,
    totalSlides: 3,
    slides: [
      {
        id: 1,
        type: 'title',
        title: topic,
        subtitle: `Educational Overview for ${level} Level`,
        background: 'gradient-blue',
      },
      {
        id: 2,
        type: 'bullet-points',
        title: 'Key Points',
        points: sentences.slice(0, 5).map(s => s.trim().substring(0, 80)),
        background: 'light',
      },
      {
        id: 3,
        type: 'summary',
        title: 'Summary',
        content: sentences[0]?.trim() || 'Please read the full article for details.',
        background: 'gradient-purple',
      },
    ],
  };
}
