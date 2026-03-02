import OpenAI from 'openai';
import { prisma } from '../db/prisma';
import { formatForDisplay } from '../utils/text-cleaning-utils';
import { getCached, setCache } from '../db/redis';

interface ResearchResult {
  queryId: string;
  content: string;
  sources: any[];
  topic: string;
  complexity: string;
  fromCache?: boolean;
}

// Initialize Perplexity client
const perplexity = new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY!,
  baseURL: 'https://api.perplexity.ai',
});

console.log('🔑 Research Service - Perplexity API:', process.env.PERPLEXITY_API_KEY ? '✅ SET' : '❌ MISSING');

// Model fallback chain: cheapest/fastest first, escalate on failure
const PERPLEXITY_MODELS = [
  'sonar',
  'sonar-pro',
  'llama-3.1-sonar-large-128k-online',
] as const;

function getFriendlyErrorMessage(error: unknown): string {
  const err = error as { status?: number; code?: string; message?: string };
  const status = err?.status;
  if (status === 401) {
    return 'Research service authentication failed. Please try again later or contact support.';
  }
  if (status === 429) {
    return 'Research service is busy right now. Please wait a moment and try again.';
  }
  if (status === 503 || status === 500) {
    return 'Research service is temporarily unavailable. Please try again in a few minutes.';
  }
  if (err?.code === 'ECONNREFUSED' || err?.code === 'ENOTFOUND') {
    return 'Unable to reach the research service. Please check your internet connection and try again.';
  }
  return 'Research failed. Please try again.';
}

export async function processResearchQuery(params: {
  userId: string;
  queryText: string;
  learningLevel: string;
}): Promise<ResearchResult> {

  const { userId, queryText, learningLevel } = params;

  console.log('Processing research query:', { userId, queryText, learningLevel });
  // Check cache first
  const cacheKey = `research:${userId}:${queryText}:${learningLevel}`;
  const cached = await getCached<ResearchResult>(cacheKey);

  if (cached) {
    console.log('✓ Research loaded from cache');
    return {
      ...cached,
      fromCache: true,
    };
  }

  console.log('✗ Cache miss, generating new research');

  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  // Create query record
  const query = await prisma.query.create({
    data: {
      userId,
      queryText,
      complexityLevel: learningLevel,
      status: 'processing',
    },
  });
  console.log('✓ Query created:', query.id);

  try {
    console.log('🔍 Perplexity research started:', queryText);
    console.log('  - Level:', learningLevel);

    // Try each model in order — use first successful response
    let response: Awaited<ReturnType<typeof perplexity.chat.completions.create>> | null = null;
    let lastError: unknown = null;

    for (const model of PERPLEXITY_MODELS) {
      try {
        console.log(`🔍 Trying Perplexity model: ${model}`);
        response = await perplexity.chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content: getSystemPrompt(learningLevel),
            },
            {
              role: 'user',
              content: formatForDisplay(queryText),
            },
          ],
          temperature: 0.2,
          max_tokens: 4000,
        });
        console.log(`✅ Model ${model} succeeded`);
        break;
      } catch (modelError) {
        console.error(`❌ Model ${model} failed:`, modelError);
        lastError = modelError;
      }
    }

    if (!response) {
      // All models failed — delete the query record so it doesn't pollute history
      await prisma.query.delete({ where: { id: query.id } });
      throw new Error(getFriendlyErrorMessage(lastError));
    }

    const content = response.choices[0].message.content || '';
    const citations = (response as any).citations || [];
    const cleanedContent = formatForDisplay(content);
    console.log('✅ Perplexity research completed:');
    console.log('  - Content length:', content.length, 'characters');
    console.log('  - Citations:', citations.length);

    // Format sources from citations
    const sources = citations.map((url: string, idx: number) => ({
      title: `Source ${idx + 1}`,
      url,
      snippet: url,
    }));

    // Save research data to database
    await prisma.researchData.create({
      data: {
        queryId: query.id,
        rawData: {
          cleanedContent,
          citations,
          model: 'perplexity-sonar',
        } as any,
        sources: sources as any,
        summary: cleanedContent.substring(0, 500),
      },
    });

    // Update query status
    await prisma.query.update({
      where: { id: query.id },
      data: {
        status: 'completed',
        topicDetected: queryText,
      },
    });

    // Prepare result
    const result: ResearchResult = {
      queryId: query.id,
      content: cleanedContent,
      sources: sources,
      topic: queryText,
      complexity: learningLevel,
      fromCache: false,
    };

    // Cache for 24 hours
    await setCache(cacheKey, result, 86400);

    console.log('💾 Research cached for 24 hours');

    return result;
  } catch (error: any) {
    console.error('❌ Research post-processing error:', error);
    // If we get here, the API call succeeded but something else failed (e.g. DB write).
    // The query record exists — mark it failed but don't delete.
    await prisma.query.update({
      where: { id: query.id },
      data: { status: 'failed' },
    }).catch(() => {}); // ignore if query was already deleted by the fallback loop
    throw new Error(getFriendlyErrorMessage(error));
  }
}

function getSystemPrompt(level: string): string {
  const guidelines = {
    elementary: 'Use simple language, short sentences, and lots of examples. Explain as if teaching a 10-year-old.',
    'high-school': 'Balance accessibility with depth. Introduce technical terms but explain them clearly.',
    college: 'Academic rigor with proper citations. Use domain-specific terminology.',
    adult: 'Professional tone with practical applications. Focus on career relevance.',
  };

  const levelGuideline = guidelines[level as keyof typeof guidelines] || guidelines.college;

  return `You are an expert educational researcher specializing in ${level} level education.

${levelGuideline}

Provide:
1. Clear, comprehensive explanation
2. Break down complex concepts
3. Include examples and applications
4. Use accurate, up-to-date information
5. Include citations naturally

Focus on educational content that is accurate and engaging.`;
}
