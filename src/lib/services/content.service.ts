import OpenAI from 'openai';
import { generateSpeech } from '../api/elevenlabs';
import { prisma } from '../db/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

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
  learningLevel: string = 'college'
): Promise<string> {
  if (!groq) {
    throw new Error('GROQ_API_KEY not configured');
  }

  console.log('📝 Generating article with Groq (Llama 3.1)...');

  const levelGuidelines = {
    elementary: 'Use simple language, short sentences, and lots of examples',
    'high-school': 'Balance accessibility with depth, introduce technical terms',
    college: 'Academic rigor, cite research, use domain terminology',
    adult: 'Professional tone, practical applications, career relevance',
  };

  const systemPrompt = `You are an expert educational content creator specializing in ${learningLevel} education. ${levelGuidelines[learningLevel as keyof typeof levelGuidelines]}. Focus on clarity, accuracy, and engagement.`;

  const prompt = `Based on this research: ${researchData}

Create a comprehensive educational article about "${topic}".

Structure:
1. Introduction (hook the learner)
2. Core Concepts (clear explanations)
3. Examples & Applications
4. Summary & Key Takeaways

Make it engaging, clear, and appropriate for ${learningLevel} level.`;

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant', // FREE, fast, good quality
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
      max_tokens: 4000,
    });

    const article = response.choices[0].message.content || '';

    console.log(`✅ Article generated: ${article.length} characters`);
    return article;
  } catch (error: any) {
    console.error('❌ Groq article generation error:', error.message);
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

  // Generate article with Groq
  const article = await generateArticleWithGroq(
    research.summary,
    research.query.queryText,
    research.query.complexityLevel || 'college'
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

  // Generate audio in background (non-blocking)
  if (process.env.ELEVENLABS_API_KEY) {
    generateAudioAsync(queryId, article).catch((error) => {
      console.warn('⚠️ Audio generation skipped:', error.message);
    });
  } else {
    console.log('⚠️ ELEVENLABS_API_KEY not set, skipping audio generation');
  }

  return articleContent;
}

async function generateAudioAsync(queryId: string, text: string) {
  try {
    console.log(`🎵 Starting audio generation for query: ${queryId}`);

    const audioBuffer = await generateSpeech({ text });
    const audioDir = join(process.cwd(), 'public', 'audio');
    
    if (!existsSync(audioDir)) {
      await mkdir(audioDir, { recursive: true });
    }
    
    const audioPath = join(audioDir, `${queryId}.mp3`);
    await writeFile(audioPath, audioBuffer);

    await prisma.content.create({
      data: {
        queryId,
        contentType: 'audio',
        title: 'Audio Narration',
        storageUrl: `/audio/${queryId}.mp3`,
        data: { duration: 0 },
      },
    });

    console.log(`✅ Audio generated: ${queryId}.mp3`);
  } catch (error: any) {
    console.error('❌ Audio generation failed:', error.message);
  }
}