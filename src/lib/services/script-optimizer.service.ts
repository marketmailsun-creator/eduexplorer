import { GoogleGenerativeAI } from '@google/generative-ai';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const genAI = GOOGLE_API_KEY ? new GoogleGenerativeAI(GOOGLE_API_KEY) : null;

interface VideoScriptOptions {
  articleText: string;
  topic: string;
  maxDuration: number; // in minutes (5-8)
  targetWords?: number; // defaults to 150 words per minute
}

/**
 * Generate a concise video script from full article using Gemini
 * Targets 5-8 minutes = ~750-1200 words = ~5000-8000 characters
 * IMPORTANT: Must stay under 10,000 characters for ElevenLabs TTS
 */
export async function generateVideoScript(
  options: VideoScriptOptions
): Promise<string> {
  const {
    articleText,
    topic,
    maxDuration = 8,
    targetWords = 150,
  } = options;

  const maxWords = maxDuration * targetWords; // e.g., 8 * 150 = 1200 words
  const maxCharacters = 9500; // Leave buffer below 10,000 ElevenLabs limit

  console.log('📝 Generating video script with Gemini...');
  console.log(`  - Target: ${maxDuration} minutes (${maxWords} words, ~${maxCharacters} chars)`);

  if (!genAI) {
    throw new Error('GOOGLE_API_KEY not configured');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `Convert this educational article into a concise ${maxDuration}-minute video script.

CRITICAL REQUIREMENTS:
1. Maximum ${maxWords} words (approximately ${maxCharacters} characters)
2. Natural conversational tone suitable for AI voiceover
3. No visual cues, stage directions, or [VISUAL] markers
4. Just pure narration text
5. Clear sections but NO section headers in output

ARTICLE:
${articleText}

STRUCTURE (but don't include these headers in output):
- Brief engaging introduction (30 seconds)
- 3-4 main points with examples (6-7 minutes)  
- Quick summary (30 seconds)

Generate ONLY the narration text that will be spoken, nothing else:`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let script = response.text();
    
    console.log(`✅ Initial script generated: ${script.length} characters`);

    // Clean up any formatting markers
    script = cleanVideoScript(script);

    // If still too long, truncate intelligently
    if (script.length > maxCharacters) {
      console.warn(`⚠️  Script too long (${script.length} chars), truncating to ${maxCharacters}`);
      script = intelligentTruncate(script, maxCharacters);
    }

    console.log(`✅ Final script: ${script.length} characters (${script.split(/\s+/).length} words)`);
    
    return script;
  } catch (error: any) {
    console.error('❌ Gemini script generation error:', error.message);
    throw error;
  }
}

/**
 * Clean script of any visual markers or formatting
 */
function cleanVideoScript(script: string): string {
  return script
    .replace(/\[VISUAL:.*?\]/gi, '') // Remove visual markers
    .replace(/\[PAUSE\]/gi, '...') // Convert pauses
    .replace(/\[INTRODUCTION\]/gi, '') // Remove section markers
    .replace(/\[POINT \d+:.*?\]/gi, '')
    .replace(/\[CONCLUSION\]/gi, '')
    .replace(/\[.*?\]/g, '') // Remove any remaining brackets
    .replace(/\n{3,}/g, '\n\n') // Clean up excessive newlines
    .replace(/^\s*[-*]\s+/gm, '') // Remove bullet points
    .replace(/^#+\s+/gm, '') // Remove markdown headers
    .trim();
}

/**
 * Intelligently truncate script at sentence boundary
 */
function intelligentTruncate(script: string, maxLength: number): string {
  if (script.length <= maxLength) return script;

  // Try to cut at sentence boundary
  const truncated = script.substring(0, maxLength);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastExclaim = truncated.lastIndexOf('!');
  const lastQuestion = truncated.lastIndexOf('?');
  
  const lastSentenceEnd = Math.max(lastPeriod, lastExclaim, lastQuestion);
  
  if (lastSentenceEnd > maxLength * 0.9) {
    // Cut at sentence if we're not losing too much
    return truncated.substring(0, lastSentenceEnd + 1);
  }
  
  // Otherwise just hard cut with ellipsis
  return truncated.substring(0, maxLength - 3) + '...';
}

/**
 * Split long script into chunks for ElevenLabs (if needed)
 * Each chunk must be under 10,000 characters
 */
export function splitScriptForTTS(script: string, maxChunkSize: number = 9500): string[] {
  if (script.length <= maxChunkSize) {
    return [script];
  }

  console.log(`📝 Splitting script into chunks (max ${maxChunkSize} chars each)...`);

  const chunks: string[] = [];
  const sentences = script.split(/(?<=[.!?])\s+/); // Split on sentence boundaries
  
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= maxChunkSize) {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    } else {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = sentence;
    }
  }
  
  if (currentChunk) chunks.push(currentChunk);
  
  console.log(`✅ Split into ${chunks.length} chunks`);
  chunks.forEach((chunk, i) => {
    console.log(`   Chunk ${i + 1}: ${chunk.length} characters`);
  });
  
  return chunks;
}

/**
 * Estimate script duration in seconds
 */
export function estimateScriptDuration(script: string): number {
  const wordCount = script.split(/\s+/).length;
  const wordsPerMinute = 150; // Conservative for educational content
  return Math.ceil((wordCount / wordsPerMinute) * 60);
}

/**
 * Generate key points version (for flashcards) using Gemini
 */
export async function generateKeyPoints(articleText: string, topic: string): Promise<string[]> {
  if (!genAI) {
    throw new Error('GOOGLE_API_KEY not configured');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `Extract 5-7 key points from this article about "${topic}". 
Each point should be ONE concise sentence (max 15 words).

ARTICLE:
${articleText}

Return ONLY the bullet points, one per line, no numbering or markdown.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text.split('\n').filter(line => line.trim().length > 0);
  } catch (error: any) {
    console.error('❌ Gemini key points error:', error.message);
    
    // Fallback: extract first sentence of each paragraph
    const paragraphs = articleText.split('\n\n').filter(p => p.trim().length > 0);
    return paragraphs
      .map(p => p.split(/[.!?]/)[0].trim())
      .filter(s => s.length > 20 && s.length < 150)
      .slice(0, 7);
  }
}
