import Anthropic from '@anthropic-ai/sdk';
import { formatForAudio } from '../utils/text-formatter';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: `You are an expert at creating concise, engaging audio summaries for educational content. 
Your summaries are optimized for text-to-speech and listening comprehension.`,
      messages: [
        {
          role: 'user',
          content: `Create a concise audio summary of this educational content for ${learningLevel} level students.

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

Generate the audio summary now (plain text only, no formatting):`,
        },
      ],
    });

    const summary = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as any).text)
      .join('\n');

    // Clean any remaining formatting
    const cleanSummary = formatForAudio(summary);

    // Verify word count
    const wordCount = cleanSummary.split(/\s+/).length;
    console.log(`📝 Audio summary generated: ${wordCount} words (~${Math.ceil(wordCount / 150)} minutes)`);

    return cleanSummary;
  } catch (error) {
    console.error('Audio summary generation error:', error);
    // Fallback: truncate original text
    return truncateForAudio(text, targetWords);
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
