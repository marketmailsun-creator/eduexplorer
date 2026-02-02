import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateSpeech } from '../api/elevenlabs';
import { generateAudioSummary, estimateAudioDuration } from './audio-summarizer';
import { prisma } from '../db/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const genAI = GOOGLE_API_KEY ? new GoogleGenerativeAI(GOOGLE_API_KEY) : null;

console.log('🔑 Content Service - API Key Status:');
console.log('  - GOOGLE_API_KEY:', GOOGLE_API_KEY ? '✅ SET' : '❌ MISSING');

async function generateArticleWithGemini(
  researchData: string,
  topic: string,
  learningLevel: string = 'college'
): Promise<string> {
  if (!genAI) {
    throw new Error('GOOGLE_API_KEY not configured');
  }

  console.log('📝 Generating article with Google Gemini...');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const levelGuidelines = {
    elementary: 'Use simple language, short sentences, and lots of examples',
    'high-school': 'Balance accessibility with depth, introduce technical terms',
    college: 'Academic rigor, cite research, use domain terminology',
    adult: 'Professional tone, practical applications, career relevance',
  };

  const prompt = `You are an expert educational content creator specializing in ${learningLevel} education. ${levelGuidelines[learningLevel as keyof typeof levelGuidelines]}. Focus on clarity, accuracy, and engagement.

Based on this research: ${researchData}

Create a comprehensive educational article about "${topic}".

Structure:
1. Introduction (hook the learner)
2. Core Concepts (clear explanations)
3. Examples & Applications
4. Summary & Key Takeaways

Make it engaging, clear, and appropriate for ${learningLevel} level.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const article = response.text();

    console.log(`✅ Article generated: ${article.length} characters`);
    return article;
  } catch (error: any) {
    console.error('❌ Gemini article generation error:', error.message);
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

  // Generate article with Gemini
  const article = await generateArticleWithGemini(
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

  console.log(`✅ Article created`);

  // Generate audio (async, non-blocking)
  if (process.env.ELEVENLABS_API_KEY) {
    generateAudioAsync(
      queryId, 
      article, 
      research.query.complexityLevel || 'college'
    ).catch((error) => {
      console.error('❌ Audio generation failed:', error.message);
    });
  } else {
    console.warn('⚠️  ELEVENLABS_API_KEY not configured. Skipping audio generation.');
  }

  console.log('ℹ️  Video generation skipped - user must request manually');

  return articleContent;
}

async function generateAudioAsync(
  queryId: string, 
  fullText: string,
  learningLevel: string
) {
  try {
    console.log('═══════════════════════════════════════════════');
    console.log('🎤 STARTING AUDIO GENERATION');
    console.log('═══════════════════════════════════════════════');

    const audioText = await generateAudioSummary({
      text: fullText,
      maxDurationMinutes: 10,
      learningLevel: learningLevel,
    });

    const estimatedDuration = estimateAudioDuration(audioText);
    const wordCount = audioText.split(/\s+/).length;
    
    console.log(`✅ Audio summary: ${wordCount} words (~${Math.ceil(estimatedDuration / 60)} min)`);

    console.log('🎤 Generating speech with ElevenLabs...');
    
    let audioBuffer: Buffer;
    try {
      audioBuffer = await generateSpeech({ text: audioText });
      console.log(`✅ Audio generated: ${audioBuffer.length} bytes`);
    } catch (speechError: any) {
      console.error('❌ ElevenLabs error:', speechError.message);
      
      await prisma.content.create({
        data: {
          queryId,
          contentType: 'audio',
          title: 'Audio Generation Failed',
          data: { error: speechError.message, status: 'failed' },
        },
      });
      throw speechError;
    }

    const audioDir = join(process.cwd(), 'public', 'audio');
    if (!existsSync(audioDir)) await mkdir(audioDir, { recursive: true });
    
    const audioPath = join(audioDir, `${queryId}.mp3`);
    await writeFile(audioPath, audioBuffer);
    console.log(`✅ Audio saved: ${audioPath}`);

    await prisma.content.create({
      data: {
        queryId,
        contentType: 'audio',
        title: `Audio Summary`,
        storageUrl: `/audio/${queryId}.mp3`,
        data: { 
          duration: estimatedDuration,
          wordCount: wordCount,
          status: 'completed',
        },
      },
    });

    console.log('═══════════════════════════════════════════════');
    console.log(`✅ AUDIO GENERATION COMPLETED`);
    console.log('═══════════════════════════════════════════════\n');

  } catch (error: any) {
    console.error('❌ AUDIO GENERATION FAILED:', error.message);
    throw error;
  }
}
