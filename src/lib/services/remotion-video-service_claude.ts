import { prisma } from '../db/prisma';
import axios from 'axios';
import Anthropic from '@anthropic-ai/sdk';
import { formatForAudio } from '../utils/text-formatter';
import { generateSpeech } from '../api/elevenlabs';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const UNSPLASH_API_KEY = process.env.UNSPLASH_API_KEY;

console.log('🔑 Video Service - API Keys Status:');
console.log('  - PEXELS_API_KEY:', PEXELS_API_KEY ? '✅ SET' : '❌ MISSING');
console.log('  - UNSPLASH_API_KEY:', UNSPLASH_API_KEY ? '✅ SET' : '❌ MISSING');

interface VideoScene {
  id: number;
  narration: string;
  keywords: string[];
  duration: number;
  videoUrl?: string;
  imageUrl?: string;
  type: 'video' | 'image';
}

interface VideoJob {
  jobId: string;
  status: 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  provider: string;
}

async function searchPexelsVideo(query: string): Promise<string | null> {
  if (!PEXELS_API_KEY) return null;
  try {
    console.log(`🔍 Searching Pexels for: "${query}"`);
    const response = await axios.get('https://api.pexels.com/videos/search', {
      params: { query, per_page: 1, orientation: 'landscape' },
      headers: { 'Authorization': PEXELS_API_KEY },
      timeout: 10000,
    });
    if (response.data.videos?.length > 0) {
      const hdFile = response.data.videos[0].video_files.find((f: any) => 
        f.quality === 'hd' || f.quality === 'sd'
      );
      if (hdFile) {
        console.log(`✅ Found Pexels video`);
        return hdFile.link;
      }
    }
    return null;
  } catch (error: any) {
    console.error(`❌ Pexels error:`, error.message);
    return null;
  }
}

async function searchUnsplashImage(query: string): Promise<string | null> {
  if (!UNSPLASH_API_KEY) return null;
  try {
    console.log(`🔍 Searching Unsplash for: "${query}"`);
    const response = await axios.get('https://api.unsplash.com/search/photos', {
      params: { query, per_page: 1, orientation: 'landscape' },
      headers: { 'Authorization': `Client-ID ${UNSPLASH_API_KEY}` },
      timeout: 10000,
    });
    if (response.data.results?.length > 0) {
      console.log(`✅ Found Unsplash image`);
      return response.data.results[0].urls.regular;
    }
    return null;
  } catch (error: any) {
    console.error(`❌ Unsplash error:`, error.message);
    return null;
  }
}

async function generateVideoScenes(script: string, topic: string): Promise<VideoScene[]> {
  console.log(`🎬 Generating video scenes`);
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: `Break this into 15-20 video scenes (5-8 sec each).
TOPIC: ${topic}
SCRIPT: ${script}
Return ONLY JSON array:
[{"narration": "...", "keywords": ["word1", "word2"], "duration": 6}]`
      }],
    });
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = responseText.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (jsonMatch) {
      const scenes = JSON.parse(jsonMatch[0]);
      console.log(`✅ Generated ${scenes.length} scenes`);
      return scenes.map((s: any, i: number) => ({
        id: i + 1,
        narration: s.narration,
        keywords: s.keywords || [],
        duration: s.duration || 6,
        type: 'video',
      }));
    }
    throw new Error('Failed to parse scenes');
  } catch (error: any) {
    console.error('❌ Scene generation error:', error.message);
    const sentences = script.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return sentences.slice(0, 15).map((s, i) => ({
      id: i + 1,
      narration: s.trim(),
      keywords: s.toLowerCase().split(/\s+/).filter(w => w.length > 4).slice(0, 3),
      duration: 6,
      type: 'video' as const,
    }));
  }
}

async function fetchStockFootage(scenes: VideoScene[]): Promise<VideoScene[]> {
  console.log(`📹 Fetching stock footage for ${scenes.length} scenes...`);
  const updatedScenes = await Promise.all(
    scenes.map(async (scene) => {
      const searchQuery = scene.keywords.join(' ');
      const videoUrl = await searchPexelsVideo(searchQuery);
      if (videoUrl) return { ...scene, videoUrl, type: 'video' as const };
      const imageUrl = await searchUnsplashImage(searchQuery);
      if (imageUrl) return { ...scene, imageUrl, type: 'image' as const };
      return scene;
    })
  );
  const withMedia = updatedScenes.filter(s => s.videoUrl || s.imageUrl).length;
  console.log(`✅ Found media for ${withMedia}/${scenes.length} scenes`);
  return updatedScenes;
}

async function downloadMedia(url: string, filepath: string): Promise<void> {
  console.log(`⬇️  Downloading: ${url.substring(0, 50)}...`);
  const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
  await writeFile(filepath, response.data);
  console.log(`✅ Downloaded: ${filepath}`);
}

async function renderVideoWithFFmpeg(
  scenes: VideoScene[],
  audioPath: string,
  outputPath: string,
  tempDir: string
): Promise<void> {
  console.log('═══════════════════════════════════════════════');
  console.log('🎥 STARTING FFMPEG VIDEO RENDERING');
  console.log('═══════════════════════════════════════════════');

  // Download all media
  for (const scene of scenes) {
    if (scene.videoUrl) {
      const filename = `scene-${scene.id}-video.mp4`;
      const filepath = join(tempDir, filename);
      await downloadMedia(scene.videoUrl, filepath);
      scene.videoUrl = filepath;
    } else if (scene.imageUrl) {
      const filename = `scene-${scene.id}-image.jpg`;
      const filepath = join(tempDir, filename);
      await downloadMedia(scene.imageUrl, filepath);
      scene.imageUrl = filepath;
    }
  }

  console.log('\n🎬 Creating video clips from media...');
  
  // Create video clips for each scene
  const videoClips: string[] = [];
  for (const scene of scenes) {
    const clipPath = join(tempDir, `clip-${scene.id}.mp4`);
    
    if (scene.videoUrl) {
      // Trim video to scene duration
      console.log(`✂️  Processing video clip ${scene.id}...`);
      await execAsync(
        `ffmpeg -y -i "${scene.videoUrl}" -t ${scene.duration} -c:v libx264 -c:a aac -preset fast "${clipPath}"`
      );
    } else if (scene.imageUrl) {
      // Convert image to video clip
      console.log(`🖼️  Converting image ${scene.id} to video...`);
      await execAsync(
        `ffmpeg -y -loop 1 -i "${scene.imageUrl}" -t ${scene.duration} -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=30" -c:v libx264 -preset fast -pix_fmt yuv420p "${clipPath}"`
      );
    } else {
      // Create black screen for scenes without media
      console.log(`⬛ Creating placeholder for scene ${scene.id}...`);
      await execAsync(
        `ffmpeg -y -f lavfi -i color=c=black:s=1920x1080:d=${scene.duration}:r=30 -c:v libx264 -preset fast "${clipPath}"`
      );
    }
    
    videoClips.push(clipPath);
  }

  console.log('\n🔗 Concatenating all clips...');
  
  // Create concat file
  const concatFilePath = join(tempDir, 'concat.txt');
  const concatContent = videoClips.map(clip => `file '${clip}'`).join('\n');
  await writeFile(concatFilePath, concatContent);

  // Concatenate all clips
  const videoOnlyPath = join(tempDir, 'video-no-audio.mp4');
  await execAsync(
    `ffmpeg -y -f concat -safe 0 -i "${concatFilePath}" -c copy "${videoOnlyPath}"`
  );

  console.log('\n🎤 Adding audio track...');
  
  // Add audio to video
  await execAsync(
    `ffmpeg -y -i "${videoOnlyPath}" -i "${audioPath}" -c:v copy -c:a aac -shortest "${outputPath}"`
  );

  console.log('═══════════════════════════════════════════════');
  console.log('✅ FFMPEG VIDEO RENDERING COMPLETED');
  console.log(`📹 Video saved: ${outputPath}`);
  console.log('═══════════════════════════════════════════════\n');

  // Cleanup temp files
  console.log('🧹 Cleaning up temp files...');
  for (const clip of videoClips) {
    try { await unlink(clip); } catch {}
  }
  for (const scene of scenes) {
    if (scene.videoUrl && scene.videoUrl.includes(tempDir)) {
      try { await unlink(scene.videoUrl); } catch {}
    }
    if (scene.imageUrl && scene.imageUrl.includes(tempDir)) {
      try { await unlink(scene.imageUrl); } catch {}
    }
  }
  try { await unlink(concatFilePath); } catch {}
  try { await unlink(videoOnlyPath); } catch {}
}

export async function generateCustomVideo(
  queryId: string,
  articleText: string
): Promise<VideoJob> {
  const jobId = `custom-${Date.now()}`;
  let videoContentId: string | undefined;

  console.log('═══════════════════════════════════════════════');
  console.log('🎬 STARTING VIDEO GENERATION');
  console.log('═══════════════════════════════════════════════');
  console.log(`📌 Query ID: ${queryId}`);
  console.log(`📌 Job ID: ${jobId}`);

  try {
    const query = await prisma.query.findUnique({ where: { id: queryId } });
    if (!query) throw new Error(`Query not found: ${queryId}`);

    // Create DB record FIRST
    const videoContent = await prisma.content.create({
      data: {
        queryId,
        contentType: 'video',
        title: `${query.queryText} - Video`,
        storageUrl: `/videos/${queryId}.mp4`,
        data: {
          jobId,
          status: 'processing',
          provider: 'custom-remotion',
          progress: 0,
        },
      },
    });
    videoContentId = videoContent.id;

    // Generate script
    console.log('\n📝 Step 1: Generating script...');
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Create a 10-minute video script about "${query.queryText}".
Max 1,500 words. Educational and engaging.
CONTENT: ${articleText}
Generate script:`
      }],
    });
    const script = formatForAudio(message.content[0].type === 'text' ? message.content[0].text : '');

    await prisma.content.update({
      where: { id: videoContentId },
      data: { data: { jobId, status: 'processing', progress: 20, script } },
    });

    // Generate scenes
    console.log('\n🎬 Step 2: Generating scenes...');
    const scenes = await generateVideoScenes(script, query.queryText);

    await prisma.content.update({
      where: { id: videoContentId },
      data: { data: { jobId, status: 'processing', progress: 40, script, sceneCount: scenes.length } },
    });

    // Fetch stock footage
    console.log('\n📹 Step 3: Fetching stock footage...');
    const scenesWithMedia = await fetchStockFootage(scenes);
    const mediaCount = scenesWithMedia.filter(s => s.videoUrl || s.imageUrl).length;

    await prisma.content.update({
      where: { id: videoContentId },
      data: { data: { jobId, status: 'processing', progress: 60, script, sceneCount: scenes.length, scenesWithMedia: mediaCount } },
    });

    // Generate audio
    console.log('\n🎤 Step 4: Generating voiceover...');
    const audioBuffer = await generateSpeech({ text: script });
    const audioDir = join(process.cwd(), 'public', 'audio');
    if (!existsSync(audioDir)) await mkdir(audioDir, { recursive: true });
    const audioPath = join(audioDir, `${queryId}-video.mp3`);
    await writeFile(audioPath, audioBuffer);

    await prisma.content.update({
      where: { id: videoContentId },
      data: { data: { jobId, status: 'processing', progress: 80, script, sceneCount: scenes.length, scenesWithMedia: mediaCount } },
    });

    // Render video with FFmpeg
    console.log('\n🎥 Step 5: Rendering video...');
    const videoDir = join(process.cwd(), 'public', 'videos');
    if (!existsSync(videoDir)) await mkdir(videoDir, { recursive: true });
    const videoPath = join(videoDir, `${queryId}.mp4`);
    const tempDir = join(process.cwd(), 'temp', `video-${queryId}`);
    if (!existsSync(tempDir)) await mkdir(tempDir, { recursive: true });

    await renderVideoWithFFmpeg(scenesWithMedia, audioPath, videoPath, tempDir);

    // Mark as completed
    await prisma.content.update({
      where: { id: videoContentId },
      data: {
        data: {
          jobId,
          status: 'completed',
          provider: 'custom-remotion',
          script,
          sceneCount: scenes.length,
          scenesWithMedia: mediaCount,
          progress: 100,
          completedAt: new Date().toISOString(),
        },
      },
    });

    console.log('═══════════════════════════════════════════════');
    console.log('✅ VIDEO GENERATION COMPLETED');
    console.log('═══════════════════════════════════════════════\n');

    return {
      jobId,
      status: 'completed',
      videoUrl: `/videos/${queryId}.mp4`,
      provider: 'custom-remotion',
    };

  } catch (error: any) {
    console.error('═══════════════════════════════════════════════');
    console.error('❌ VIDEO GENERATION FAILED');
    console.error('═══════════════════════════════════════════════');
    console.error('Error:', error.message);
    
    if (videoContentId) {
      await prisma.content.update({
        where: { id: videoContentId },
        data: {
          data: {
            jobId,
            status: 'failed',
            error: error.message,
            failedAt: new Date().toISOString(),
          },
        },
      });
    }
    throw error;
  }
}
