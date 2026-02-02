import { prisma } from '../db/prisma';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { formatForAudio } from '../utils/text-formatter';
import { generateSpeech } from '../api/elevenlabs';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { generateVideoScript, splitScriptForTTS, estimateScriptDuration } from './script-optimizer.service';

const execAsync = promisify(exec);

// Initialize Google Gemini
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const genAI = GOOGLE_API_KEY ? new GoogleGenerativeAI(GOOGLE_API_KEY) : null;

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const UNSPLASH_API_KEY = process.env.UNSPLASH_API_KEY;

console.log('🔑 Video Service - API Keys Status:');
console.log('  - GOOGLE_API_KEY:', GOOGLE_API_KEY ? '✅ SET' : '❌ MISSING');
console.log('  - PEXELS_API_KEY:', PEXELS_API_KEY ? '✅ SET' : '❌ MISSING');
console.log('  - UNSPLASH_API_KEY:', UNSPLASH_API_KEY ? '✅ SET' : '❌ MISSING');
console.log('  - ELEVENLABS_API_KEY:', process.env.ELEVENLABS_API_KEY ? '✅ SET' : '❌ MISSING');

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

async function generateScriptWithGemini(topic: string, articleText: string): Promise<string> {
  if (!genAI) {
    throw new Error('GOOGLE_API_KEY not configured');
  }

  console.log('📝 Generating script with Google Gemini...');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }); 

  const prompt = `Create a concise 10-minute educational video script about "${topic}".

Requirements:
- Maximum 1,500 words
- Clear, engaging narration suitable for voiceover
- Educational and appropriate for high school to college level
- Organized with clear sections

Article content to base the script on:
${articleText}

Generate a natural, conversational script for video narration:`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const script = response.text();
    
    console.log(`✅ Script generated with Gemini: ${script.split(/\s+/).length} words`);
    return script;
  } catch (error: any) {
    console.error('❌ Gemini script generation error:', error.message);
    throw error;
  }
}

async function generateScenesWithGemini(script: string, topic: string): Promise<VideoScene[]> {
  if (!genAI) {
    throw new Error('GOOGLE_API_KEY not configured');
  }

  console.log('🎬 Generating video scenes with Google Gemini...');

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `Break this video script into 15-20 scenes for video production.

TOPIC: ${topic}

SCRIPT:
${script}

For each scene, provide:
1. Narration (what will be spoken)
2. Keywords (2-3 words for finding relevant stock footage)
3. Duration (5-8 seconds)

Return ONLY a valid JSON array in this exact format (no markdown, no explanation):
[
  {
    "narration": "Introduction to the topic...",
    "keywords": ["education", "learning", "science"],
    "duration": 6
  },
  {
    "narration": "Next point...",
    "keywords": ["technology", "innovation"],
    "duration": 7
  }
]

Generate the JSON array now:`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    console.log('📄 Gemini response received, parsing scenes...');
    
    // Try to extract JSON from response
    const jsonMatch = responseText.match(/\[\s*\{[\s\S]*\}\s*\]/);
    
    if (jsonMatch) {
      const scenes = JSON.parse(jsonMatch[0]);
      console.log(`✅ Generated ${scenes.length} scenes with Gemini`);
      
      return scenes.map((scene: any, index: number) => ({
        id: index + 1,
        narration: scene.narration || '',
        keywords: Array.isArray(scene.keywords) ? scene.keywords : [],
        duration: scene.duration || 6,
        type: 'video' as const,
      }));
    }
    
    throw new Error('Failed to parse scene JSON from Gemini response');
  } catch (error: any) {
    console.error('❌ Gemini scene generation error:', error.message);
    console.log('⚠️ Falling back to basic scene generation');
    
    // Fallback: create basic scenes
    const sentences = script.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return sentences.slice(0, 15).map((sentence, index) => ({
      id: index + 1,
      narration: sentence.trim(),
      keywords: sentence.toLowerCase().split(/\s+/).filter(w => w.length > 4).slice(0, 3),
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
  
  const videoClips: string[] = [];
  for (const scene of scenes) {
    const clipPath = join(tempDir, `clip-${scene.id}.mp4`);
    
    if (scene.videoUrl) {
      console.log(`✂️  Processing video clip ${scene.id}...`);
      await execAsync(
        `ffmpeg -y -i "${scene.videoUrl}" -t ${scene.duration} -c:v libx264 -c:a aac -preset fast "${clipPath}"`
      );
    } else if (scene.imageUrl) {
      console.log(`🖼️  Converting image ${scene.id} to video...`);
      await execAsync(
        `ffmpeg -y -loop 1 -i "${scene.imageUrl}" -t ${scene.duration} -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=30" -c:v libx264 -preset fast -pix_fmt yuv420p "${clipPath}"`
      );
    } else {
      console.log(`⬛ Creating placeholder for scene ${scene.id}...`);
      await execAsync(
        `ffmpeg -y -f lavfi -i color=c=black:s=1920x1080:d=${scene.duration}:r=30 -c:v libx264 -preset fast "${clipPath}"`
      );
    }
    
    videoClips.push(clipPath);
  }

  console.log('\n🔗 Concatenating all clips...');
  
  const concatFilePath = join(tempDir, 'concat.txt');
  const concatContent = videoClips.map(clip => `file '${clip}'`).join('\n');
  await writeFile(concatFilePath, concatContent);

  const videoOnlyPath = join(tempDir, 'video-no-audio.mp4');
  await execAsync(
    `ffmpeg -y -f concat -safe 0 -i "${concatFilePath}" -c copy "${videoOnlyPath}"`
  );

  console.log('\n🎤 Adding audio track...');
  
  await execAsync(
    `ffmpeg -y -i "${videoOnlyPath}" -i "${audioPath}" -c:v copy -c:a aac -shortest "${outputPath}"`
  );

  console.log('═══════════════════════════════════════════════');
  console.log('✅ FFMPEG VIDEO RENDERING COMPLETED');
  console.log(`📹 Video saved: ${outputPath}`);
  console.log('═══════════════════════════════════════════════\n');

  // Cleanup
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
): Promise<any> {
  const jobId = `custom-${Date.now()}`;
  let videoContentId: string | undefined;

  console.log('═══════════════════════════════════════════════');
  console.log('🎬 STARTING VIDEO GENERATION (Gemini 2.0)');
  console.log('═══════════════════════════════════════════════');

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
          provider: 'custom-gemini',
          progress: 0,
        },
      },
    });
    videoContentId = videoContent.id;

    // Generate script with Gemini (optimized for length)
    console.log('\n📝 Step 1: Generating optimized script with Gemini...');
    const script = await generateVideoScript({
      articleText,
      topic: query.queryText,
      maxDuration: 8, // 8 minutes max
      targetWords: 150,
    });

    const estimatedDuration = estimateScriptDuration(script);
    console.log(`✅ Script ready: ${script.length} chars (~${Math.ceil(estimatedDuration / 60)} min)`);

    await prisma.content.update({
      where: { id: videoContentId },
      data: { data: { jobId, status: 'processing', progress: 20, script, provider: 'custom-gemini' } },
    });

    // Generate scenes (use existing function)
    console.log('\n🎬 Step 2: Generating scenes...');
    const scenes = await generateScenesWithGemini(script, query.queryText);

    await prisma.content.update({
      where: { id: videoContentId },
      data: { data: { jobId, status: 'processing', progress: 40, script, sceneCount: scenes.length, provider: 'custom-gemini' } },
    });

    // Fetch stock footage
    console.log('\n📹 Step 3: Fetching stock footage...');
    const scenesWithMedia = await fetchStockFootage(scenes);
    const mediaCount = scenesWithMedia.filter(s => s.videoUrl || s.imageUrl).length;

    await prisma.content.update({
      where: { id: videoContentId },
      data: { data: { jobId, status: 'processing', progress: 60, script, sceneCount: scenes.length, scenesWithMedia: mediaCount, provider: 'custom-gemini' } },
    });

    // Generate audio WITH CHUNKING
    console.log('\n🎤 Step 4: Generating voiceover (with chunking)...');
    
    // Split script if needed
    const scriptChunks = splitScriptForTTS(script, 9500);
    console.log(`📝 Script split into ${scriptChunks.length} chunk(s)`);

    const audioDir = join(process.cwd(), 'public', 'audio');
    if (!existsSync(audioDir)) await mkdir(audioDir, { recursive: true });

    if (scriptChunks.length === 1) {
      // Single chunk - simple case
      console.log('🎤 Generating single audio file...');
      const audioBuffer = await generateSpeech({ text: scriptChunks[0] });
      const audioPath = join(audioDir, `${queryId}-video.mp3`);
      await writeFile(audioPath, audioBuffer);
      console.log(`✅ Audio saved: ${audioPath}`);
    } else {
      // Multiple chunks - need to concatenate
      console.log(`🎤 Generating ${scriptChunks.length} audio chunks...`);
      const chunkFiles: string[] = [];

      for (let i = 0; i < scriptChunks.length; i++) {
        console.log(`🎤 Generating chunk ${i + 1}/${scriptChunks.length}...`);
        const audioBuffer = await generateSpeech({ text: scriptChunks[i] });
        const chunkPath = join(audioDir, `${queryId}-chunk-${i}.mp3`);
        await writeFile(chunkPath, audioBuffer);
        chunkFiles.push(chunkPath);
      }

      // Concatenate audio chunks with FFmpeg
      console.log('🔗 Concatenating audio chunks...');
      const concatListPath = join(audioDir, `${queryId}-concat.txt`);
      const concatContent = chunkFiles.map(f => `file '${f}'`).join('\n');
      await writeFile(concatListPath, concatContent);

      const finalAudioPath = join(audioDir, `${queryId}-video.mp3`);
      await execAsync(
        `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c copy "${finalAudioPath}"`
      );

      // Cleanup chunk files
      for (const chunkFile of chunkFiles) {
        try { await unlink(chunkFile); } catch {}
      }
      try { await unlink(concatListPath); } catch {}

      console.log(`✅ Audio concatenated: ${finalAudioPath}`);
    }

    await prisma.content.update({
      where: { id: videoContentId },
      data: { data: { jobId, status: 'processing', progress: 80, script, sceneCount: scenes.length, scenesWithMedia: mediaCount, provider: 'custom-gemini' } },
    });

    // Render video (use existing FFmpeg function)
    console.log('\n🎥 Step 5: Rendering video with FFmpeg...');
    const videoDir = join(process.cwd(), 'public', 'videos');
    if (!existsSync(videoDir)) await mkdir(videoDir, { recursive: true });
    const videoPath = join(videoDir, `${queryId}.mp4`);
    const tempDir = join(process.cwd(), 'temp', `video-${queryId}`);
    if (!existsSync(tempDir)) await mkdir(tempDir, { recursive: true });

    const audioPath = join(audioDir, `${queryId}-video.mp3`);
    await renderVideoWithFFmpeg(scenesWithMedia, audioPath, videoPath, tempDir);

    // Mark as completed
    await prisma.content.update({
      where: { id: videoContentId },
      data: {
        data: {
          jobId,
          status: 'completed',
          provider: 'custom-gemini',
          script,
          sceneCount: scenes.length,
          scenesWithMedia: mediaCount,
          progress: 100,
          completedAt: new Date().toISOString(),
          chunkedAudio: scriptChunks.length > 1,
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
      provider: 'custom-gemini',
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
