import { generateArticle } from '../api/claude';
import { generateSpeech } from '../api/elevenlabs';
import { generateAudioSummary, estimateAudioDuration } from './audio-summarizer';
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

  console.log(`📝 Generating content for query: ${queryId}`);

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

  console.log(`✅ Article created`);

  // Generate audio (async, non-blocking) - WITH ERROR HANDLING
  if (process.env.ELEVENLABS_API_KEY) {
    generateAudioAsync(
      queryId, 
      article, 
      research.query.complexityLevel || 'college'
    ).catch((error) => {
      console.error('❌ Audio generation failed:', error.message);
      // Don't throw - audio is optional
    });
  } else {
    console.warn('⚠️  ELEVENLABS_API_KEY not configured. Skipping audio generation.');
  }

  // ❌ DO NOT AUTO-GENERATE VIDEO
  // User must explicitly request video generation via the "Generate Video" button
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
    console.log(`📌 Query ID: ${queryId}`);
    console.log(`📝 Original text length: ${fullText.length} characters`);

    // STEP 1: Generate concise audio summary
    console.log('\n📝 Step 1: Generating audio summary...');
    const audioText = await generateAudioSummary({
      text: fullText,
      maxDurationMinutes: 10,
      learningLevel: learningLevel,
    });

    const estimatedDuration = estimateAudioDuration(audioText);
    const wordCount = audioText.split(/\s+/).length;
    
    console.log(`✅ Audio summary generated:`);
    console.log(`  - Length: ${audioText.length} characters`);
    console.log(`  - Words: ${wordCount}`);
    console.log(`  - Estimated duration: ${Math.ceil(estimatedDuration / 60)} minutes`);

    // STEP 2: Generate audio with ElevenLabs
    console.log('\n🎤 Step 2: Generating speech with ElevenLabs...');
    
    let audioBuffer: Buffer;
    try {
      audioBuffer = await generateSpeech({ text: audioText });
      console.log(`✅ Audio generated: ${audioBuffer.length} bytes`);
    } catch (speechError: any) {
      console.error('❌ ElevenLabs API error:', speechError.message);
      
      // Create a failed audio record so we know it was attempted
      await prisma.content.create({
        data: {
          queryId,
          contentType: 'audio',
          title: 'Audio Generation Failed',
          data: {
            error: speechError.message,
            status: 'failed',
            wordCount,
            estimatedDuration,
          },
        },
      });
      
      throw new Error(`ElevenLabs failed: ${speechError.message}`);
    }

    // STEP 3: Save audio file
    console.log('\n💾 Step 3: Saving audio file...');
    const audioDir = join(process.cwd(), 'public', 'audio');
    
    if (!existsSync(audioDir)) {
      console.log(`📁 Creating audio directory: ${audioDir}`);
      await mkdir(audioDir, { recursive: true });
    }
    
    const audioPath = join(audioDir, `${queryId}.mp3`);
    await writeFile(audioPath, audioBuffer);
    console.log(`✅ Audio file saved: ${audioPath}`);

    // STEP 4: Store audio content record in DB
    console.log('\n💾 Step 4: Saving to database...');
    await prisma.content.create({
      data: {
        queryId,
        contentType: 'audio',
        title: `Audio Summary`,
        storageUrl: `/audio/${queryId}.mp3`,
        data: { 
          duration: estimatedDuration,
          wordCount: wordCount,
          isSummary: true,
          summaryLength: audioText.length,
          originalLength: fullText.length,
          compressionRatio: ((1 - (audioText.length / fullText.length)) * 100).toFixed(1) + '%',
          status: 'completed',
        },
      },
    });

    console.log('═══════════════════════════════════════════════');
    console.log(`✅ AUDIO GENERATION COMPLETED`);
    console.log(`   File: /audio/${queryId}.mp3`);
    console.log(`   Duration: ~${Math.ceil(estimatedDuration / 60)} minutes`);
    console.log('═══════════════════════════════════════════════\n');

  } catch (error: any) {
    console.error('═══════════════════════════════════════════════');
    console.error('❌ AUDIO GENERATION FAILED');
    console.error('═══════════════════════════════════════════════');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('═══════════════════════════════════════════════\n');
    throw error;
  }
}
