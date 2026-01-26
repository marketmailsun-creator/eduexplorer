import { prisma } from '../db/prisma';
import axios from 'axios';

const SYNTHESIA_API_KEY = process.env.SYNTHESIA_API_KEY;
const SYNTHESIA_API_URL = 'https://api.synthesia.io/v2';


interface VideoJob {
  jobId: string;
  status: 'processing' | 'completed' | 'failed';
  videoUrl?: string;
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
