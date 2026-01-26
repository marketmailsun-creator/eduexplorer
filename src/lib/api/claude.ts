import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ResearchResult {
  content: string;
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
  topic: string;
  complexity: string;
}

export async function researchTopic(
  query: string,
  learningLevel: string = 'college'
): Promise<ResearchResult> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    tools: [
      {
        type: 'web_search_20250305',
        name: 'web_search',
      },
    ],
    messages: [
      {
        role: 'user',
        content: `explain this educational topic : "${query}"
        
Target audience: ${learningLevel} level students

Provide:
1. Core concepts and definitions
2. Key principles and theories  
3. Real-world applications
4. Common misconceptions
5. Related topics for further study

Cite all sources used.`,
      },
    ],
  });

  // Extract content and sources
  const textContent = message.content
    .filter((block) => block.type === 'text')
    .map((block) => (block as any).text)
    .join('\n');

  // Extract sources from citations (simplified)
  const sources = extractSources(textContent);

  return {
    content: textContent,
    sources,
    topic: query,
    complexity: learningLevel,
  };
}

export async function generateArticle(
  researchData: string,
  topic: string,
  learningLevel: string = 'college'
): Promise<string> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    system: getSystemPrompt(learningLevel),
    messages: [
      {
        role: 'user',
        content: `Based on this explanation: ${researchData}

Create a educational article about "${topic}".

Structure:
1. Introduction (hook the learner)
2. Core Concepts (clear explanations)
3. Examples & Applications
4. Summary & Key Takeaways

Make it engaging, clear, and appropriate for ${learningLevel} level.`,
      },
    ],
  });

  return message.content[0].type === 'text' ? message.content[0].text : '';
}

function getSystemPrompt(level: string): string {
  const guidelines = {
    elementary: 'Use simple language, short sentences, and lots of examples',
    'high-school': 'Balance accessibility with depth, introduce technical terms',
    college: 'Academic rigor, cite research, use domain terminology',
    adult: 'Professional tone, practical applications, career relevance',
  };

  return `You are an expert educational content creator specializing in ${level} education. ${guidelines[level as keyof typeof guidelines]}. Focus on clarity, accuracy, and engagement.`;
}

function extractSources(content: string): Array<{ title: string; url: string; snippet: string }> {
  // Simplified source extraction - in production, use proper citation parsing
  const sources: Array<{ title: string; url: string; snippet: string }> = [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = content.match(urlRegex) || [];
  
  urls.forEach((url, index) => {
    sources.push({
      title: `Source ${index + 1}`,
      url,
      snippet: 'Referenced in research',
    });
  });

  return sources;
}