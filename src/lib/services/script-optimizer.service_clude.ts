import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
const MODEL = 'claude-sonnet-4-5-20250929';
interface VideoScriptOptions {
  articleText: string;
  topic: string;
  maxDuration: number; // in minutes (5-8)
  targetWords?: number; // defaults to 150-200 words per minute
}

/**
 * Generate a concise video script from full article
 * Targets 5-8 minutes = ~750-1600 words
 */
export async function generateVideoScript(
  options: VideoScriptOptions
): Promise<string> {
  const {
    articleText,
    topic,
    maxDuration = 8,
    targetWords = 150, // words per minute (conservative for educational content)
  } = options;

  const maxWords = maxDuration * targetWords;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: `You are an educational video script writer. Create engaging, concise scripts suitable for AI avatar narration.`,
    messages: [
      {
        role: 'user',
        content: `Convert this educational article into a ${maxDuration}-minute video script (approximately ${maxWords} words).

ARTICLE:
${articleText}

REQUIREMENTS:
1. Create a compelling script for an AI avatar (female teacher) to narrate
2. Maximum ${maxWords} words (strict limit)
3. Structure: Introduction → 3-5 Key Points → Conclusion
4. Use simple, conversational language (avoid complex jargon)
5. Include natural pauses with [PAUSE] markers
6. Add visual cue suggestions in [VISUAL: ...] markers
7. Make it engaging and easy to understand
8. Each section should be clearly separated

FORMAT:
[INTRODUCTION]
Brief hook and topic introduction

[POINT 1: Title]
Explanation with example
[VISUAL: Suggested graphic/diagram]

[POINT 2: Title]
...

[CONCLUSION]
Summary and key takeaway

Generate the script now:`,
      },
    ],
  });

  const script = message.content[0].type === 'text' ? message.content[0].text : '';
  
  // Clean up the script
  return cleanVideoScript(script);
}

/**
 * Clean and format the script for video APIs
 */
function cleanVideoScript(script: string): string {
  return script
    .replace(/\[VISUAL:.*?\]/g, '') // Remove visual markers (we'll add them separately)
    .replace(/\[PAUSE\]/g, '...') // Convert pauses to ellipsis
    .replace(/\[INTRODUCTION\]/gi, '') // Remove section markers
    .replace(/\[POINT \d+:.*?\]/gi, '')
    .replace(/\[CONCLUSION\]/gi, '')
    .replace(/\n{3,}/g, '\n\n') // Clean up excessive newlines
    .trim();
}

/**
 * Extract visual cues for adding images/graphics to video
 */
export function extractVisualCues(script: string): string[] {
  const visualRegex = /\[VISUAL: (.*?)\]/g;
  const visuals: string[] = [];
  let match;

  while ((match = visualRegex.exec(script)) !== null) {
    visuals.push(match[1]);
  }

  return visuals;
}

/**
 * Split script into scenes for better video generation
 */
export function splitIntoScenes(script: string): Array<{
  text: string;
  duration: number;
}> {
  const sections = script.split('\n\n').filter(s => s.trim().length > 0);
  
  return sections.map(section => {
    const wordCount = section.split(/\s+/).length;
    const duration = Math.ceil(wordCount / 2.5); // ~150 words per minute = 2.5 words per second
    
    return {
      text: section.trim(),
      duration,
    };
  });
}

/**
 * Estimate script duration in seconds
 */
export function estimateScriptDuration(script: string): number {
  const wordCount = script.split(/\s+/).length;
  const wordsPerMinute = 150; // Conservative estimate for educational content
  return Math.ceil((wordCount / wordsPerMinute) * 60);
}

/**
 * Generate bullet points version (for flashcards)
 */
export async function generateKeyPoints(articleText: string, topic: string): Promise<string[]> {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: `Extract 5-7 key points from this article about "${topic}". 
Each point should be ONE concise sentence (max 15 words).

ARTICLE:
${articleText}

Return ONLY the bullet points, one per line, no numbering or markdown.`,
      },
    ],
  });

  const response = message.content[0].type === 'text' ? message.content[0].text : '';
  return response.split('\n').filter(line => line.trim().length > 0);
}