// workers/video-renderer-worker.ts
import { Worker, Job } from 'bullmq';
import { prisma } from '../src/lib/db/prisma';
import { generateSpeech } from '../src/lib/api/elevenlabs';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');

console.log('═══════════════════════════════════════════════');
console.log('🎬 VIDEO RENDERING WORKER STARTING');
console.log('═══════════════════════════════════════════════');
console.log(`Redis: ${REDIS_HOST}:${REDIS_PORT}`);

interface VideoRenderJob {
  videoContentId: string;
  queryId: string;
  blueprint: any;
  audioPath: string | null;
}

// Create worker
const videoWorker = new Worker<VideoRenderJob>(
  'video-render',
  async (job: Job<VideoRenderJob>) => {
    const { videoContentId, queryId, blueprint, audioPath } = job.data;

    console.log('\n═══════════════════════════════════════════════');
    console.log(`🎬 Processing video job: ${job.id}`);
    console.log(`   Query ID: ${queryId}`);
    console.log(`   Video Content ID: ${videoContentId}`);
    console.log('═══════════════════════════════════════════════\n');

    try {
      // Update progress: 70%
      await updateProgress(videoContentId, 'rendering', 70);
      await job.updateProgress(70);

      // PLACEHOLDER: For now, just simulate rendering
      console.log('📋 Blueprint received:');
      console.log(`  - ${blueprint.scenes?.length || 0} scenes`);
      console.log(`  - Duration: ${blueprint.totalDuration}s`);
      console.log(`  - Audio: ${audioPath}`);

      // Simulate rendering time
      console.log('🎥 Simulating video rendering...');
      await sleep(3000); // 3 seconds for demo
      await job.updateProgress(80);

      await sleep(3000);
      await job.updateProgress(90);

      // For now, mark as completed without actual video
      // In production, this is where Remotion rendering happens
      const videoUrl = `/videos/${queryId}.mp4`;
      
      console.log('✅ Video rendering simulation complete');
      
      await updateProgress(videoContentId, 'completed', 100, videoUrl);

      console.log('\n═══════════════════════════════════════════════');
      console.log(`✅ Job ${job.id} completed`);
      console.log(`   Video URL: ${videoUrl}`);
      console.log('═══════════════════════════════════════════════\n');

      return { success: true, videoUrl };

    } catch (error: any) {
      console.error('\n═══════════════════════════════════════════════');
      console.error(`❌ Job ${job.id} failed`);
      console.error('═══════════════════════════════════════════════');
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);

      await updateProgress(videoContentId, 'failed', 0);
      throw error;
    }
  },
  {
    connection: {
      host: REDIS_HOST,
      port: REDIS_PORT,
    },
    concurrency: 1, // Process one video at a time
  }
);

// Helper: Update video progress in database
async function updateProgress(
  videoContentId: string,
  status: string,
  progress: number,
  videoUrl?: string
) {
  try {
    await prisma.content.update({
      where: { id: videoContentId },
      data: {
        data: {
          status,
          progress,
          provider: 'remotion',
          ...(videoUrl && { videoUrl }),
        } as any,
        ...(videoUrl && { storageUrl: videoUrl }),
      },
    });
  } catch (error) {
    console.error('Failed to update progress:', error);
  }
}

// Helper: Sleep function
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Event handlers
videoWorker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

videoWorker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

videoWorker.on('progress', (job, progress) => {
  console.log(`📊 Job ${job.id} progress: ${progress}%`);
});

videoWorker.on('error', (err) => {
  console.error('❌ Worker error:', err);
});

console.log('═══════════════════════════════════════════════');
console.log('✅ VIDEO RENDERING WORKER READY');
console.log(`   Waiting for jobs on queue: video-render`);
console.log(`   Concurrency: 1 (one video at a time)`);
console.log('═══════════════════════════════════════════════\n');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully...');
  await videoWorker.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully...');
  await videoWorker.close();
  await prisma.$disconnect();
  process.exit(0);
});

export default videoWorker;
