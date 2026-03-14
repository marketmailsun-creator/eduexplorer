import { GoogleGenerativeAI } from '@google/generative-ai';
import { incrementUsageCounter } from '../db/redis';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const genAI = GOOGLE_API_KEY ? new GoogleGenerativeAI(GOOGLE_API_KEY) : null;
const MODEL = 'gemini-2.5-flash';

interface ModerationResult {
  isAppropriate: boolean;
  reason?: string;
  category?: string;
  severity?: 'low' | 'medium' | 'high';
}

/**
 * Check if content is appropriate for educational use
 * Filters out adult, violent, illegal, or inappropriate content
 */
export async function moderateContent(
  query: string,
  userAge?: number
): Promise<ModerationResult> {
  if (!genAI) {
    console.warn('⚠️ GOOGLE_API_KEY missing — skipping AI moderation (fail open)');
    return { isAppropriate: true };
  }

  try {
    console.log('🛡️ Moderating content (Gemini):', query.substring(0, 50) + '...');

    const ageContext = userAge && userAge < 18
      ? `The user is ${userAge} years old (minor). Apply strict content filtering.`
      : 'The user is an adult, but still filter inappropriate content.';

    const model = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction: `You are a content moderation system for an educational platform. Your job is to determine if a user's query is appropriate for educational content generation.

${ageContext}

REJECT queries that contain:
- Adult/sexual content or innuendo
- Violence, gore, or graphic descriptions
- Illegal activities or instructions
- Hate speech or discrimination
- Self-harm or dangerous activities
- Profanity or vulgar language
- Drug/substance abuse
- Weapons or harmful instructions
- Harassment or bullying
- Privacy violations

ALLOW queries about:
- Academic subjects (all levels)
- Science, technology, history, arts
- Health education (age-appropriate)
- Current events and news (age-appropriate)
- Skills and hobbies
- Career and professional development
- General knowledge topics

Respond in JSON format only (no markdown, no explanation outside JSON):
{
  "isAppropriate": true/false,
  "reason": "Brief explanation",
  "category": "sexual/violent/illegal/hate/drugs/profanity/safe",
  "severity": "low/medium/high"
}`,
    });

    await incrementUsageCounter('gemini');
    const result = await model.generateContent(`Moderate this query: "${query}"`);
    const responseText = result.response.text();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ Invalid moderation response format');
      return { isAppropriate: true };
    }

    const parsed = JSON.parse(jsonMatch[0]) as ModerationResult;

    if (!parsed.isAppropriate) {
      console.log('🚫 Content blocked:', parsed.category, '- Severity:', parsed.severity);
      console.log('   Reason:', parsed.reason);
    } else {
      console.log('✅ Content approved');
    }

    return parsed;
  } catch (error) {
    console.error('❌ Moderation error:', error);
    // Fail open - allow content if moderation fails
    return { isAppropriate: true };
  }
}

/**
 * Get age-appropriate error message
 */
export function getModerationErrorMessage(
  result: ModerationResult,
  userAge?: number
): string {
  const isMinor = userAge && userAge < 18;

  const messages: Record<string, string> = {
    sexual: "This search contains adult content. EduExplorer is an educational platform — please search for a subject like 'Biology', 'History', or 'Mathematics' instead.",

    violent: "This content contains violent or graphic themes. Please ask about educational topics that don't involve violence or harm.",

    illegal: "We cannot provide information about illegal activities. Please ask about legal and educational topics.",

    hate: "This query contains discriminatory or hateful language. Please rephrase your question respectfully.",

    drugs: isMinor
      ? "Content about substances is not appropriate for users under 18. Please ask about other educational topics."
      : "We provide general health education, but cannot assist with drug-related queries. Try asking about health science instead.",

    profanity: "Please rephrase your question without profanity so we can help you learn.",

    self_harm: "If you're struggling with difficult thoughts, please reach out to a counselor or crisis helpline. We're here for educational support on other topics.",
  };

  return messages[result.category || ''] || result.reason ||
    "Please search for an educational subject. EduExplorer generates learning content for academic topics only.";
}

/**
 * Quick keyword-based pre-check (faster than AI moderation)
 * Returns true if content might be inappropriate
 */
export function quickModerationCheck(query: string): boolean {
  const lowercaseQuery = query.toLowerCase();

  // Common inappropriate keywords (expanded list)
  const blockedKeywords = [
    // Sexual / adult content — phrases first to avoid false positives
    'sex video', 'porn', 'pornography', 'xxx', 'nude', 'naked', 'erotic',
    'adult content', 'adult film', 'sexy', 'sexual', 'hentai', 'nsfw',
    'onlyfans', 'cam girl', 'escort', 'prostitut',
    // Violence
    'kill', 'murder', 'suicide', 'bomb making', 'how to make a bomb',
    'weapon instructions', 'assassination', 'mass shooting',
    // Drugs (non-educational)
    'cocaine', 'heroin', 'methamphetamine', 'meth', 'how to make drugs',
    'drug synthesis', 'crystal meth',
    // Hate speech
    'racist', 'nazi', 'white supremac', 'ethnic cleansing',
    // Self-harm
    'how to self harm', 'how to cut myself', 'how to kill myself',
  ];

  // Phrases need substring match; single words need word boundaries
  for (const keyword of blockedKeywords) {
    if (keyword.includes(' ')) {
      if (lowercaseQuery.includes(keyword)) {
        console.log('🚫 Quick moderation: Blocked phrase detected:', keyword);
        return true;
      }
    } else {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(lowercaseQuery)) {
        console.log('🚫 Quick moderation: Blocked keyword detected:', keyword);
        return true;
      }
    }
  }

  return false; // Seems okay
}
