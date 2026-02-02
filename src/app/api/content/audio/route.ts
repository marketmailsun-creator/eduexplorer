import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { generateSpeech } from '@/lib/api/elevenlabs';
import { prisma } from '@/lib/db/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { z } from 'zod';
import { formatForAudio } from '@/lib/utils/text-formatter';

const audioSchema = z.object({
  contentId: z.string(),
  voiceId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { contentId, voiceId } = audioSchema.parse(body);

    // Get the content
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      include: { query: true },
    });

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Check if user owns this content
    if (content.query.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Extract text from content
    const rawText = typeof content.data === 'object' && content.data !== null
      ? (content.data as any).text || ''
      : String(content.data);

    if (!rawText) {
      return NextResponse.json({ error: 'No text content to convert' }, { status: 400 });
    }

    // CLEAN TEXT: Remove markdown formatting for better audio
    const cleanText = formatForAudio(rawText);

    console.log('🎤 Audio API: Cleaning text for TTS');
    console.log('Original length:', rawText.length);
    console.log('Cleaned length:', cleanText.length);

    // Generate audio with cleaned text
    const audioBuffer = await generateSpeech({
      text: cleanText,
      voiceId: voiceId || 'Rachel',
    });

    // Save audio file
    const audioDir = join(process.cwd(), 'public', 'audio');
    if (!existsSync(audioDir)) {
      await mkdir(audioDir, { recursive: true });
    }

    const filename = `${contentId}.mp3`;
    const audioPath = join(audioDir, filename);
    await writeFile(audioPath, audioBuffer);

    // Update or create audio content record
    const audioContent = await prisma.content.upsert({
      where: {
        id: `${contentId}-audio`,
      },
      create: {
        id: `${contentId}-audio`,
        queryId: content.queryId,
        contentType: 'audio',
        title: `${content.title} - Audio`,
        storageUrl: `/audio/${filename}`,
        data: { 
          duration: 0, 
          originalContentId: contentId,
          cleanedTextSample: cleanText.substring(0, 200) // Store sample for debugging
        },
      },
      update: {
        storageUrl: `/audio/${filename}`,
        generatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      audioUrl: `/audio/${filename}`,
      audioContent,
      cleaned: {
        originalLength: rawText.length,
        cleanedLength: cleanText.length,
        removed: rawText.length - cleanText.length
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Audio generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate audio' },
      { status: 500 }
    );
  }
}
