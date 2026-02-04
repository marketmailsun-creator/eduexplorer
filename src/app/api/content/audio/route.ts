import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { generateSpeech } from '@/lib/api/elevenlabs';
import { prisma } from '@/lib/db/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { z } from 'zod';

const audioSchema = z.object({
  queryId: z.string(),
  voiceId: z.string().optional(),
  regenerate: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { queryId, voiceId, regenerate } = audioSchema.parse(body);

    console.log('🎵 Audio generation request:', { queryId, regenerate });

    // Get the query and check ownership
    const query = await prisma.query.findUnique({
      where: { id: queryId },
      include: {
        content: {
          where: { contentType: 'article' },
        },
      },
    });

    if (!query) {
      return NextResponse.json({ error: 'Query not found' }, { status: 404 });
    }

    if (query.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if audio already exists (unless regenerating)
    if (!regenerate) {
      const existingAudio = await prisma.content.findFirst({
        where: {
          queryId,
          contentType: 'audio',
        },
      });

      if (existingAudio && existingAudio.storageUrl) {
        console.log('✅ Audio already exists, returning existing');
        return NextResponse.json({
          success: true,
          audioUrl: existingAudio.storageUrl,
          cached: true,
        });
      }
    }

    // Get article content
    const articleContent = query.content[0];
    if (!articleContent) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    const articleData = articleContent.data as any;
    const text = articleData?.text || '';

    if (!text) {
      return NextResponse.json({ error: 'No text content to convert' }, { status: 400 });
    }

    console.log('📝 Generating audio from text:', text.length, 'characters');

    // Generate audio
    let audioBuffer: Buffer;
    try {
      audioBuffer = await generateSpeech({ text: text });
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

    // const audioBuffer = await generateSpeech({
    //   text,
    //   voiceId: voiceId || 'Rachel',
    // });

    console.log('✅ Audio generated:', audioBuffer.length, 'bytes');

    // Save audio file
    const audioDir = join(process.cwd(), 'public', 'audio');
    if (!existsSync(audioDir)) {
      await mkdir(audioDir, { recursive: true });
    }

    const filename = `${queryId}.mp3`;
    const audioPath = join(audioDir, filename);
    await writeFile(audioPath, audioBuffer);

    console.log('💾 Audio saved to:', audioPath);

    // Update or create audio content record
    const audioContent = await prisma.content.upsert({
      where: {
        id: regenerate ? `${queryId}-audio-${Date.now()}` : `${queryId}-audio`,
      },
      create: {
        id: `${queryId}-audio`,
        queryId,
        contentType: 'audio',
        title: `${query.queryText} - Audio`,
        storageUrl: `/audio/${filename}`,
        data: { 
          duration: 0,
          voiceId: voiceId || 'Rachel',
          status: 'completed',
        },
      },
      update: {
        storageUrl: `/audio/${filename}`,
        generatedAt: new Date(),
        data: {
          duration: 0,
          voiceId: voiceId || 'Rachel',
          status: 'completed',
        },
      },
    });

    console.log('✅ Audio content record saved:', audioContent.id);

    return NextResponse.json({
      success: true,
      audioUrl: `/audio/${filename}`,
      audioContent,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('❌ Audio generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate audio' },
      { status: 500 }
    );
  }
}
