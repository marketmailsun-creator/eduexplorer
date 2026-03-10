import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { formatForAudio } from '../utils/text-formatter';
import { incrementUsageCounter, sendQuotaAlertOnce } from '../db/redis';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const genAI = GOOGLE_API_KEY ? new GoogleGenerativeAI(GOOGLE_API_KEY) : null;
const MODEL = 'gemini-2.5-flash';

// Groq client — free tier fallback, OpenAI-compatible API
const groqClient = process.env.GROQ_API_KEY
  ? new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    })
  : null;

interface AudioSummaryOptions {
  text: string;
  maxDurationMinutes?: number;
  learningLevel?: string;
}

/**
 * Generate concise audio-optimized summary
 * Target: ~150 words per minute of audio
 * Max 10 minutes = ~1500 words
 */
export async function generateAudioSummary(
  options: AudioSummaryOptions
): Promise<string> {
  const {
    text,
    maxDurationMinutes = 10,
    learningLevel = 'college',
  } = options;

  const targetWords = maxDurationMinutes * 150; // 150 words per minute

  if (!genAI) {
    console.warn('⚠️ GOOGLE_API_KEY missing — using Groq fallback for audio summary');
    const groqSummary = await generateAudioSummaryWithGroq(options);
    if (groqSummary) return groqSummary;
    return truncateForAudio(text, targetWords);
  }

  try {
    await incrementUsageCounter('gemini');
    const geminiModel = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction: `You are an expert at creating concise, engaging audio summaries for educational content.
Your summaries are optimized for text-to-speech and listening comprehension.`,
    });

    const prompt = `Create a concise audio summary of this educational content for ${learningLevel} level students.

REQUIREMENTS:
- Maximum ${targetWords} words (for ${maxDurationMinutes}-minute audio)
- Focus ONLY on the most important concepts and key points
- Write for listening, not reading (conversational, clear)
- No markdown, formatting, or special characters
- Use simple sentences with natural pauses
- Include only essential information
- Make it engaging and easy to follow when spoken

STRUCTURE:
1. Brief introduction (1-2 sentences)
2. Main concepts (3-5 key points)
3. Brief conclusion (1 sentence)

ORIGINAL CONTENT:
${text}

Generate the audio summary now (plain text only, no formatting):`;

    const result = await geminiModel.generateContent(prompt);
    const summary = result.response.text();

    // Clean any remaining formatting
    const cleanSummary = formatForAudio(summary);

    // Verify word count
    const wordCount = cleanSummary.split(/\s+/).length;
    console.log(`📝 Audio summary generated (Gemini): ${wordCount} words (~${Math.ceil(wordCount / 150)} minutes)`);

    return cleanSummary;
  } catch (error) {
    console.error('Audio summary generation error (Gemini):', error);
    await sendQuotaAlertOnce('gemini', `Gemini audio summary failed.\nError: ${error instanceof Error ? error.message : String(error)}`);
    // Fallback 1: Try Groq (free model)
    const groqSummary = await generateAudioSummaryWithGroq(options);
    if (groqSummary) {
      console.log('✅ Used Groq fallback for audio summary');
      return groqSummary;
    }
    // Fallback 2: Plain truncation
    console.warn('⚠️ Using plain truncation fallback for audio summary');
    return truncateForAudio(text, targetWords);
  }
}

async function generateAudioSummaryWithGroq(
  options: AudioSummaryOptions
): Promise<string | null> {
  if (!groqClient) return null;

  const { text, maxDurationMinutes = 10, learningLevel = 'college' } = options;
  const targetWords = maxDurationMinutes * 150;

  try {
    const completion = await groqClient.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 2000,
      messages: [
        {
          role: 'system',
          content: `You are an expert at creating concise, engaging audio summaries for educational content optimized for text-to-speech.`,
        },
        {
          role: 'user',
          content: `Create a concise audio summary of this educational content for ${learningLevel} level students.

REQUIREMENTS:
- Maximum ${targetWords} words (for ${maxDurationMinutes}-minute audio)
- Focus ONLY on the most important concepts
- Write for listening, not reading (conversational, clear)
- No markdown, formatting, or special characters
- Use simple sentences with natural pauses

STRUCTURE: Brief intro (1-2 sentences) → Main concepts (3-5 points) → Brief conclusion (1 sentence)

ORIGINAL CONTENT:
${text}

Generate the audio summary now (plain text only):`,
        },
      ],
    });

    const summary = completion.choices[0]?.message?.content ?? null;
    if (!summary) return null;

    const cleanSummary = formatForAudio(summary);
    const wordCount = cleanSummary.split(/\s+/).length;
    console.log(`📝 Groq audio summary: ${wordCount} words`);
    return cleanSummary;
  } catch (err) {
    console.error('[Audio] Groq fallback failed:', err);
    return null;
  }
}

/**
 * Fallback: Truncate text to target word count
 */
function truncateForAudio(text: string, targetWords: number): string {
  const cleaned = formatForAudio(text);
  const words = cleaned.split(/\s+/);

  if (words.length <= targetWords) {
    return cleaned;
  }

  // Truncate to target words and ensure sentence ending
  let truncated = words.slice(0, targetWords).join(' ');

  // Try to end on a sentence
  const lastPeriod = truncated.lastIndexOf('.');
  const lastQuestion = truncated.lastIndexOf('?');
  const lastExclamation = truncated.lastIndexOf('!');

  const lastSentenceEnd = Math.max(lastPeriod, lastQuestion, lastExclamation);

  if (lastSentenceEnd > targetWords * 0.8) {
    truncated = truncated.substring(0, lastSentenceEnd + 1);
  } else {
    truncated += '.';
  }

  return truncated;
}

/**
 * Estimate audio duration in seconds based on word count
 */
export function estimateAudioDuration(text: string): number {
  const words = text.split(/\s+/).length;
  const wordsPerMinute = 150;
  return Math.ceil((words / wordsPerMinute) * 60);
}

/**
 * Get optimal word count for target duration
 */
export function getTargetWordCount(durationMinutes: number): number {
  return durationMinutes * 150;
}
