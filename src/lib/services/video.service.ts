import { prisma } from '../db/prisma';
import axios from 'axios';
import { estimateScriptDuration, generateVideoScript } from './script-optimizer.service';

// ============================================
// Synthesia API Implementation
// ============================================

const SYNTHESIA_API_KEY = process.env.SYNTHESIA_API_KEY;
const SYNTHESIA_API_URL = 'https://api.synthesia.io/v2';

const PICTORY_API_KEY = process.env.PICTORY_API_KEY;
const PICTORY_API_URL = 'https://api.pictory.ai/v1';

interface VideoJob {
  jobId: string;
  status: 'processing' | 'completed' | 'failed';
  videoUrl?: string;
}


export async function generateVideoForQuery(
  queryId: string,
  articleText: string
) {
  try {
    const query = await prisma.query.findUnique({
      where: { id: queryId },
    });

    if (!query) throw new Error('Query not found');

    console.log(`🎬 Starting video generation for query: ${queryId}`);
    console.log(`📄 Article length: ${articleText.length} characters`);

    // ✅ OPTIMIZE: Generate concise video script (5-8 minutes)
    const videoScript = await generateVideoScript({
      articleText,
      topic: query.queryText,
      maxDuration: 8, // Target 8 minutes max
      targetWords: 150, // 150 words per minute
    });

    const estimatedDuration = estimateScriptDuration(videoScript);
    console.log(`✂️ Optimized script: ${videoScript.length} characters`);
    console.log(`⏱️ Estimated duration: ${Math.ceil(estimatedDuration / 60)} minutes`);

    // Generate video with optimized script
    const videoJob = await generateSynthesiaVideo(videoScript, query.queryText);

    // Store video job info with script
    await prisma.content.create({
      data: {
        queryId,
        contentType: 'video',
        title: `${query.queryText} - Video`,
        data: {
          jobId: videoJob.jobId,
          status: 'processing',
          script: videoScript,
          estimatedDuration,
        },
      },
    });

    console.log(`✅ Video job created: ${videoJob.jobId}`);

    // Poll for video completion (in background)
    pollVideoCompletion(videoJob.jobId, queryId).catch(console.error);

    return videoJob;
  } catch (error) {
    console.error('Video generation failed:', error);
    throw error;
  }
}

async function generateSynthesiaVideo(
  script: string,
  topic: string
): Promise<VideoJob> {
  if (!SYNTHESIA_API_KEY) {
    throw new Error('SYNTHESIA_API_KEY is not configured');
  }

  try {
    const response = await axios.post(
      `${SYNTHESIA_API_URL}/videos`,
      {
        test: false,
        visibility: 'private',
        title: topic,
        input: [
          {
            scriptText: script,
            avatar: 'anna_costume1_cameraA', // Female professional avatar
            background: 'soft_gradient',
            avatarSettings: {
              horizontalAlign: 'center',
              scale: 1,
              style: 'rectangular',
            },
          },
        ],
        soundtrack: 'inspirational',
      },
      {
        headers: {
          'Authorization': SYNTHESIA_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      jobId: response.data.id,
      status: 'processing',
    };
  } catch (error: any) {
    console.error('Synthesia error:', error.response?.data || error.message);
    throw new Error('Failed to generate video with Synthesia');
  }
}

async function generatePictoryVideo(
  script: string,
  topic: string
): Promise<VideoJob> {
  if (!PICTORY_API_KEY) {
    throw new Error('PICTORY_API_KEY is not configured');
  }

  try {
    const response = await axios.post(
      `${PICTORY_API_URL}/video/text-to-video`,
      {
        script,
        title: topic,
        language: 'en',
        voice: 'Rachel',
        avatar: 'female-professional',
        backgroundMusic: 'subtle',
        pace: 'moderate',
        visualStyle: 'educational',
        includeSubtitles: true,
        resolution: '1080p',
      },
      {
        headers: {
          'Authorization': `Bearer ${PICTORY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      jobId: response.data.jobId,
      status: 'processing',
    };
  } catch (error: any) {
    console.error('Pictory error:', error.response?.data || error.message);
    throw new Error('Failed to generate video with Pictory');
  }
}

async function checkSynthesiaStatus(jobId: string): Promise<VideoJob> {
  if (!SYNTHESIA_API_KEY) {
    throw new Error('SYNTHESIA_API_KEY is not configured');
  }

  try {
    const response = await axios.get(
      `${SYNTHESIA_API_URL}/videos/${jobId}`,
      {
        headers: {
          'Authorization': SYNTHESIA_API_KEY,
        },
      }
    );

    return {
      jobId,
      status: response.data.status === 'complete' ? 'completed' : 'processing',
      videoUrl: response.data.download,
    };
  } catch (error) {
    console.error('Check Synthesia status error:', error);
    throw new Error('Failed to check video status');
  }
}

async function pollVideoCompletion(jobId: string, queryId: string) {
  const maxAttempts = 60;
  let attempts = 0;

  const poll = async () => {
    try {
      console.log(`📹 Checking video status (attempt ${attempts + 1}/${maxAttempts}): ${jobId}`);
      
      const status = await checkSynthesiaStatus(jobId);

      if (status.status === 'completed' && status.videoUrl) {
        await prisma.content.updateMany({
          where: {
            queryId,
            contentType: 'video',
          },
          data: {
            data: {
              jobId,
              status: 'completed',
              videoUrl: status.videoUrl,
            },
            storageUrl: status.videoUrl,
          },
        });
        
        console.log(`✅ Video completed and saved: ${queryId}`);
        return;
      }

      if (status.status === 'failed') {
        console.error(`❌ Video generation failed for: ${queryId}`);
        await prisma.content.updateMany({
          where: {
            queryId,
            contentType: 'video',
          },
          data: {
            data: {
              jobId,
              status: 'failed',
            },
          },
        });
        return;
      }

      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(poll, 10000);
      }
    } catch (error) {
      console.error('Video polling error:', error);
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(poll, 10000);
      }
    }
  };

  poll();
}

export async function checkVideoStatusForQuery(queryId: string) {
  const videoContent = await prisma.content.findFirst({
    where: {
      queryId,
      contentType: 'video',
    },
  });

  if (!videoContent) {
    return null;
  }

  const videoData = videoContent.data as any;

  if (videoData.status === 'completed') {
    return {
      status: 'completed',
      videoUrl: videoContent.storageUrl,
    };
  }

  if (videoData.status === 'processing' && videoData.jobId) {
    try {
      const status = await checkSynthesiaStatus(videoData.jobId);
      
      if (status.status === 'completed' && status.videoUrl) {
        await prisma.content.update({
          where: { id: videoContent.id },
          data: {
            data: {
              ...videoData,
              status: 'completed',
              videoUrl: status.videoUrl,
            },
            storageUrl: status.videoUrl,
          },
        });

        return {
          status: 'completed',
          videoUrl: status.videoUrl,
        };
      }

      return {
        status: 'processing',
      };
    } catch (error) {
      console.error('Error checking video status:', error);
      return {
        status: 'processing',
      };
    }
  }

  return {
    status: videoData.status || 'processing',
  };
}