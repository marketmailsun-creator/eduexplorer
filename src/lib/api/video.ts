import axios from 'axios';

const PICTORY_API_KEY = process.env.PICTORY_API_KEY;
const PICTORY_API_URL = 'https://api.pictory.ai/v1';

interface VideoGenerationOptions {
  script: string;
  topic: string;
  voiceId?: string;
  avatarStyle?: 'female-professional' | 'female-casual' | 'male-professional';
}

interface VideoJob {
  jobId: string;
  status: 'processing' | 'completed' | 'failed';
  videoUrl?: string;
}

export async function generateEducationalVideo(
  options: VideoGenerationOptions
): Promise<VideoJob> {
  if (!PICTORY_API_KEY) {
    throw new Error('PICTORY_API_KEY is not configured');
  }

  const {
    script,
    topic,
    voiceId = 'Rachel',
    avatarStyle = 'female-professional',
  } = options;

  try {
    // Create video job
    const response = await axios.post(
      `${PICTORY_API_URL}/video/text-to-video`,
      {
        script,
        title: topic,
        language: 'en',
        voice: voiceId,
        avatar: avatarStyle,
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
    console.error('Pictory video generation error:', error.response?.data || error.message);
    throw new Error('Failed to generate video');
  }
}

export async function checkVideoStatus(jobId: string): Promise<VideoJob> {
  if (!PICTORY_API_KEY) {
    throw new Error('PICTORY_API_KEY is not configured');
  }

  try {
    const response = await axios.get(
      `${PICTORY_API_URL}/video/status/${jobId}`,
      {
        headers: {
          'Authorization': `Bearer ${PICTORY_API_KEY}`,
        },
      }
    );

    return {
      jobId,
      status: response.data.status,
      videoUrl: response.data.videoUrl,
    };
  } catch (error) {
    console.error('Check video status error:', error);
    throw new Error('Failed to check video status');
  }
}