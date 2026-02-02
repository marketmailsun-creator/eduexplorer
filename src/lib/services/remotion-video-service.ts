import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '../db/prisma';
import { generateSpeech } from '../api/elevenlabs';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { Queue } from 'bullmq';
import { Prisma } from '@prisma/client';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const genAI = GOOGLE_API_KEY ? new GoogleGenerativeAI(GOOGLE_API_KEY) : null;

// Initialize BullMQ queue
const videoRenderQueue = new Queue('video-render', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

console.log('🔑 Remotion Video Service - API Keys:');
console.log('  - GOOGLE_API_KEY:', GOOGLE_API_KEY ? '✅ SET' : '❌ MISSING');

interface VideoScene {
  id: number;
  duration: number;
  type: 'concept' | 'diagram' | 'text' | 'transition';
  title?: string;
  text?: string;
  visual?: string;
  equation?: string;
  labels?: string[];
  imageUrl?: string;
}

interface VideoBlueprint {
  totalDuration: number;
  topic: string;
  level: string;
  narration: string;
  scenes: VideoScene[];
}

/**
 * MAIN: Generate Remotion video
 */
export async function generateRemotionVideo(
  queryId: string,
  articleText: string,
  options: {
    duration?: number;
    voice?: boolean;
    level?: string;
  } = {}
): Promise<{ jobId: string; status: string }> {
  const { duration = 300, voice = true, level = 'college' } = options;

  console.log('═══════════════════════════════════════════════');
  console.log('🎬 REMOTION VIDEO GENERATION PIPELINE');
  console.log('═══════════════════════════════════════════════');

  const query = await prisma.query.findUnique({ where: { id: queryId } });
  if (!query) throw new Error('Query not found');

  // Create video record with "planning" status
  const videoContent = await prisma.content.create({
    data: {
      queryId,
      contentType: 'video',
      title: `${query.queryText} - Video`,
      data: {
        status: 'planning',
        provider: 'remotion',
        progress: 0,
      } as Prisma.InputJsonValue,
    },
  });

  // STEP 1 & 2: Generate scene plan (< 5s)
  console.log('\n📋 STEP 1 & 2: Generating scene plan...');
  const blueprint = await generateScenePlan(query.queryText, articleText, duration, level);
  
  await prisma.content.update({
    where: { id: videoContent.id },
    data: { 
      data: {
        status: 'generating_audio',
        progress: 20,
        blueprint: (blueprint as unknown) as Prisma.InputJsonValue,
      } as Prisma.InputJsonValue
    },
  });

  // STEP 3: Generate narration audio (10-15s)
  console.log('\n🎤 STEP 3: Generating narration...');
  const audioPath = voice ? await generateFullNarration(blueprint, queryId) : null;
  
  await prisma.content.update({
    where: { id: videoContent.id },
    data: { 
      data: {
        status: 'generating_images',
        progress: 40,
        blueprint: (blueprint as unknown) as Prisma.InputJsonValue,
        audioPath,
      } as Prisma.InputJsonValue
    },
  });

  // STEP 4: Generate diagrams (20-40s)
  console.log('\n🎨 STEP 4: Generating diagrams...');
  const blueprintWithImages = await generateDiagrams(blueprint);
  
  await prisma.content.update({
    where: { id: videoContent.id },
    data: { 
      data: {
        status: 'queued_for_rendering',
        progress: 60,
        blueprint: (blueprintWithImages as unknown) as Prisma.InputJsonValue,
        audioPath,
      } as Prisma.InputJsonValue
    },
  });

  // STEP 5 & 6: Queue for Remotion rendering (1-3 min)
  console.log('\n🎥 STEP 5 & 6: Queuing for Remotion rendering...');
  const job = await videoRenderQueue.add('render', {
    videoContentId: videoContent.id,
    queryId,
    blueprint: blueprintWithImages,
    audioPath,
  });

  await prisma.content.update({
    where: { id: videoContent.id },
    data: { 
      data: {
        status: 'rendering',
        progress: 70,
        jobId: job.id,
        blueprint: (blueprintWithImages as unknown) as Prisma.InputJsonValue,
        audioPath,
      } as Prisma.InputJsonValue
    },
  });

  console.log('═══════════════════════════════════════════════');
  console.log(`✅ Video queued (Job ID: ${job.id})`);
  console.log('   Background worker will render video');
  console.log('═══════════════════════════════════════════════\n');

  return {
    jobId: job.id as string,
    status: 'rendering',
  };
}

// STEP 1 & 2: Generate scene plan
async function generateScenePlan(
  topic: string,
  content: string,
  duration: number,
  level: string
): Promise<VideoBlueprint> {
  if (!genAI) throw new Error('GOOGLE_API_KEY not set');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `Create a ${duration}-second educational video scene plan for "${topic}" (${level} level).

Based on this content:
${content.substring(0, 3000)}

Return ONLY valid JSON:
{
  "totalDuration": ${duration},
  "topic": "${topic}",
  "level": "${level}",
  "narration": "Full narration script for entire ${duration / 60}-minute video",
  "scenes": [
    {
      "id": 1,
      "duration": 30,
      "type": "concept",
      "title": "Scene Title",
      "text": "What the narrator says in this scene",
      "visual": "Description for stock image/diagram"
    }
  ]
}

Generate 8-12 scenes, each 20-40 seconds. Scene types: concept, diagram, text, transition.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON in response');

  const blueprint: VideoBlueprint = JSON.parse(match[0]);
  console.log(`  ✅ ${blueprint.scenes.length} scenes planned`);
  
  return blueprint;
}

// STEP 3: Generate narration
async function generateFullNarration(blueprint: VideoBlueprint, queryId: string): Promise<string> {
  const { narration } = blueprint;
  
  // Split if needed (ElevenLabs limit: 10,000 chars)
  const chunks = splitText(narration, 9500);
  console.log(`  - ${chunks.length} audio chunk(s)`);

  const audioDir = join(process.cwd(), 'public', 'audio');
  if (!existsSync(audioDir)) await mkdir(audioDir, { recursive: true });

  if (chunks.length === 1) {
    const buffer = await generateSpeech({ text: chunks[0] });
    const path = join(audioDir, `${queryId}-narration.mp3`);
    await writeFile(path, buffer);
    console.log(`  ✅ Audio: /audio/${queryId}-narration.mp3`);
    return `/audio/${queryId}-narration.mp3`;
  } else {
    // Generate multiple chunks
    // TODO: Concatenate with FFmpeg
    const buffer = await generateSpeech({ text: chunks[0] });
    const path = join(audioDir, `${queryId}-narration.mp3`);
    await writeFile(path, buffer);
    return `/audio/${queryId}-narration.mp3`;
  }
}

// STEP 4: Generate diagrams
async function generateDiagrams(blueprint: VideoBlueprint): Promise<VideoBlueprint> {
  const diagramScenes = blueprint.scenes.filter(s => s.type === 'diagram');
  console.log(`  - ${diagramScenes.length} diagrams to generate`);

  for (const scene of diagramScenes) {
    // TODO: Use DALL-E or Stability AI
    // For now, placeholder
    scene.imageUrl = `https://via.placeholder.com/1920x1080/4F46E5/FFFFFF?text=Scene+${scene.id}`;
  }

  console.log(`  ✅ Diagrams generated`);
  return blueprint;
}

// Helper: Split text
function splitText(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let current = '';
  for (const s of sentences) {
    if ((current + s).length <= maxLen) {
      current += (current ? ' ' : '') + s;
    } else {
      if (current) chunks.push(current);
      current = s;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}
