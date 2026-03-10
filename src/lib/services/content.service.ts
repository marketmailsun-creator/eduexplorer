import OpenAI from 'openai';
import { prisma } from '../db/prisma';
import { incrementUsageCounter, sendQuotaAlertOnce } from '../db/redis';

// Use Groq (OpenAI-compatible API)
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const groq = GROQ_API_KEY ? new OpenAI({
  apiKey: GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
}) : null;

console.log('🔑 Content Service - Groq API:', GROQ_API_KEY ? '✅ SET' : '❌ MISSING');

async function generateArticleWithGroq(
  researchData: string,
  topic: string,
  learningLevel: string = 'college',
  sources: string[] = []
): Promise<string> {
  if (!groq) {
    throw new Error('GROQ_API_KEY not configured');
  }

  console.log('📝 Generating deep article with Groq (Llama 3.3 70B)...');

  const levelDepthGuidelines = {
    elementary: `Write for curious 10-12 year olds. Use simple language and short sentences. Explain every technical word. Use relatable everyday examples. Make it exciting and fun. Avoid jargon. Use analogies children can relate to.`,
    'high-school': `Write for teenagers (14-18). Balance clarity with academic rigor. Introduce technical vocabulary but always define it. Use real examples from science, history, or culture. Connect concepts to things they've studied. Include some mathematical or quantitative examples where relevant.`,
    college: `Write at undergraduate academic level. Use precise domain terminology. Demonstrate theoretical depth and nuance. Include quantitative reasoning where applicable. Reference methodologies and frameworks. Draw connections across disciplines. Cite the type of evidence that supports each claim.`,
    adult: `Write for working professionals. Connect theory directly to practical applications and career relevance. Use industry terminology correctly. Include case studies and real-world scenarios. Acknowledge complexity and trade-offs. Focus on actionable insights alongside conceptual understanding.`,
  };

  const systemPrompt = `You are a world-class educational author and subject matter expert writing a comprehensive, in-depth educational article for ${learningLevel} level learners.

${levelDepthGuidelines[learningLevel as keyof typeof levelDepthGuidelines] || levelDepthGuidelines.college}

Your writing standards:
- Every section must go beyond surface-level description into genuine analysis and explanation
- Use specific facts, figures, dates, names, and mechanisms — not vague generalities
- Explain the WHY behind concepts, not just the WHAT
- Connect ideas to their broader context and significance
- Write with intellectual depth while maintaining clarity appropriate to the level
- Structure content with clear headings and well-developed paragraphs
- Aim for completeness — a student should finish reading and feel they truly understand the topic`;

  const sourcesList = sources.length > 0
    ? `\n\nSources consulted:\n${sources.slice(0, 8).map((url, i) => `${i + 1}. ${url}`).join('\n')}`
    : '';

  const prompt = `You have the following research on "${topic}":

---
${researchData}
---
${sourcesList}

Write a comprehensive, in-depth educational article on "${topic}" for ${learningLevel} level learners.

Use the following 8-section structure. Each section must be substantive and detailed — aim for 200-400 words per section:

## 1. Introduction
Hook the reader with a compelling opening. State why this topic matters and what they will learn. Preview the key ideas.

## 2. Background & Historical Context
When and how did this concept/field/phenomenon emerge? Who are the key figures? What historical developments led to current understanding? What problem or question does this topic address?

## 3. Core Concepts & Theoretical Foundations
Explain the fundamental principles, theories, or mechanisms in detail. Define all key terms. Break down complex ideas step by step. Use precise language appropriate to the level.

## 4. In-Depth Analysis & Explanation
Go beyond the basics. Explain HOW and WHY things work the way they do. Cover the mechanisms, processes, or reasoning in depth. Address the nuances and subtleties that distinguish real understanding from surface knowledge.

## 5. Real-World Applications & Case Studies
Provide 3-4 concrete, specific real-world examples or case studies. Show how the concepts play out in practice. Include specific details — names, places, outcomes, numbers where relevant.

## 6. Common Misconceptions & Clarifications
What do people commonly misunderstand about this topic? Correct at least 2-3 common misconceptions. Explain why the misconception exists and what the correct understanding is.

## 7. Connections & Advanced Insights
How does this topic connect to related fields or concepts? What are the broader implications? What cutting-edge developments or open questions exist? What should a curious learner explore next?

## 8. Summary & Key Takeaways
Synthesize the most important points. List 5-7 specific, actionable key takeaways that capture the essence of deep understanding. End with a thought-provoking closing statement.

Write in a clear, authoritative voice. Be specific. Use examples. Demonstrate genuine depth of knowledge. Do not use placeholder text or say "as mentioned above" — each section should stand on its own merit.`;

  try {
    await incrementUsageCounter('groq');
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 8192,
    });

    const article = response.choices[0].message.content || '';

    console.log(`✅ Article generated: ${article.length} characters`);
    return article;
  } catch (error: any) {
    console.error('❌ Groq article generation error:', error.message);
    await sendQuotaAlertOnce('groq', `Groq article generation failed.\nError: ${error.message}`);
    throw error;
  }
}

export async function generateContentForQuery(queryId: string) {
  const research = await prisma.researchData.findUnique({
    where: { queryId },
    include: { query: true },
  });

  if (!research) throw new Error('Research data not found');

  console.log(`📝 Generating content for query: ${queryId}`);

  // Use full research content (not just the 500-char summary)
  const fullResearchContent = (research.rawData as any)?.cleanedContent || research.summary;
  const sourceUrls: string[] = Array.isArray((research.rawData as any)?.citations)
    ? (research.rawData as any).citations
    : [];

  console.log(`📊 Research input: ${fullResearchContent.length} chars, ${sourceUrls.length} sources`);

  const article = await generateArticleWithGroq(
    fullResearchContent,
    research.query.queryText,
    research.query.complexityLevel || 'college',
    sourceUrls
  );

  const articleContent = await prisma.content.create({
    data: {
      queryId,
      contentType: 'article',
      title: research.query.queryText,
      data: { text: article },
    },
  });

  console.log(`✅ Article content created: ${articleContent.id}`);

  return articleContent;
}
