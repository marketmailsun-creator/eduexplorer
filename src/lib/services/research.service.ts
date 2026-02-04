import OpenAI from 'openai';
import { prisma } from '../db/prisma';
import { cacheGet, cacheSet } from '../db/redis';

// Initialize Perplexity client
const perplexity = new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY!,
  baseURL: 'https://api.perplexity.ai',
});

console.log('🔑 Research Service - Perplexity API:', process.env.PERPLEXITY_API_KEY ? '✅ SET' : '❌ MISSING');

export async function processResearchQuery(
  userId: string,
  queryText: string,
  learningLevel: string
) {
  const cacheKey = `research:${queryText}:${learningLevel}`;
  
  // Check cache first
  const cached = await cacheGet(cacheKey);
  if (cached) {
    console.log('✅ Cache hit - using cached research');
    return { ...cached, fromCache: true };
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

  try {
    console.log('🔍 Perplexity research started:', queryText);
    console.log('  - Level:', learningLevel);

    // Call Perplexity API with web search
    const response = await perplexity.chat.completions.create({
      model: 'sonar', // Fast, cheap, good quality
      messages: [
        {
          role: 'system',
          content: getSystemPrompt(learningLevel),
        },
        {
          role: 'user',
          content: queryText,
        },
      ],
      temperature: 0.2,
      max_tokens: 4000,
    });

    const content = response.choices[0].message.content || '';
    const citations = (response as any).citations || [];

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
          content,
          citations,
          model: 'perplexity-sonar',
        } as any,
        sources: sources as any,
        summary: content.substring(0, 500),
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

    const result = {
      queryId: query.id,
      content,
      sources,
      topic: queryText,
      complexity: learningLevel,
    };

    // Cache for 24 hours
    await cacheSet(cacheKey, result, 86400);

    console.log('💾 Research cached for 24 hours');

    return result;
  } catch (error: any) {
    console.error('❌ Perplexity research error:', error);
    console.error('  - Message:', error.message);
    
    await prisma.query.update({
      where: { id: query.id },
      data: { status: 'failed' },
    });
    
    throw new Error(`Research failed: ${error.message}`);
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