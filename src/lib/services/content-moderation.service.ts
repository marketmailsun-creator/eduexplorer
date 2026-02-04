import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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
  try {
    console.log('🛡️ Moderating content:', query.substring(0, 50) + '...');
    
    const ageContext = userAge && userAge < 18 
      ? `The user is ${userAge} years old (minor). Apply strict content filtering.`
      : 'The user is an adult, but still filter inappropriate content.';

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: `You are a content moderation system for an educational platform. Your job is to determine if a user's query is appropriate for educational content generation.

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

Respond in JSON format:
{
  "isAppropriate": true/false,
  "reason": "Brief explanation",
  "category": "sexual/violent/illegal/hate/drugs/profanity/safe",
  "severity": "low/medium/high"
}`,
      messages: [
        {
          role: 'user',
          content: `Moderate this query: "${query}"`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ Invalid moderation response format');
      // Fail open - allow if we can't parse (better than blocking everything)
      return { isAppropriate: true };
    }

    const result = JSON.parse(jsonMatch[0]) as ModerationResult;

    if (!result.isAppropriate) {
      console.log('🚫 Content blocked:', result.category, '- Severity:', result.severity);
      console.log('   Reason:', result.reason);
    } else {
      console.log('✅ Content approved');
    }

    return result;
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
    sexual: isMinor
      ? "This content is not appropriate for users under 18. Please ask about educational topics suitable for your age."
      : "This content contains adult themes that we don't generate educational materials for. Please try a different topic.",
    
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
    "This query doesn't seem appropriate for our educational platform. Please try asking about a different topic.";
}

/**
 * Quick keyword-based pre-check (faster than AI moderation)
 * Returns true if content might be inappropriate
 */
export function quickModerationCheck(query: string): boolean {
  const lowercaseQuery = query.toLowerCase();
  
  // Common inappropriate keywords (basic list)
  const blockedKeywords = [
    // Sexual content
    'porn', 'sex', 'xxx', 'nude', 'naked', 'erotic',
    // Violence
    'kill', 'murder', 'suicide', 'bomb', 'weapon',
    // Drugs (allow medical/educational context)
    'cocaine', 'heroin', 'meth',
    // Hate speech indicators
    'hate', 'racist', 'nazi',
  ];

  // Check for exact matches or word boundaries
  for (const keyword of blockedKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(lowercaseQuery)) {
      console.log('🚫 Quick moderation: Blocked keyword detected:', keyword);
      return true; // Might be inappropriate
    }
  }

  return false; // Seems okay
}
