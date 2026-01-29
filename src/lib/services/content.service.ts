import { generateArticle } from '../api/claude';
import { generateSpeech } from '../api/elevenlabs';
import { generateVideoForQuery } from './video.service';
import { prisma } from '../db/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function generateContentForQuery(queryId: string) {
  const research = await prisma.researchData.findUnique({
    where: { queryId },
    include: { query: true },
  });

  if (!research) throw new Error('Research data not found');

  const article = await generateArticle(
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

  // Generate audio (async, non-blocking)
  if (process.env.ELEVENLABS_API_KEY) {
    generateAudioAsync(queryId, article).catch((error) => {
      console.warn('Audio generation skipped:', error.message);
    });
  }

  // Generate video (async, non-blocking)
  if (process.env.SYNTHESIA_API_KEY || process.env.PICTORY_API_KEY) {
    generateVideoForQuery(queryId, article).catch((error) => {
      console.warn('Video generation skipped:', error.message);
    });
  }

  return articleContent;
}

async function generateAudioAsync(queryId: string, text: string) {
  try {
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
        title: `Audio`,
        storageUrl: `/audio/${queryId}.mp3`,
        data: { duration: 0 },
      },
    });

    console.log(`✅ Audio generated: ${queryId}.mp3`);
  } catch (error) {
    console.error('Audio generation failed:', error);
  }
}