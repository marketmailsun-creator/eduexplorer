import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { generateSpeech } from '@/lib/api/elevenlabs';
import { prisma } from '@/lib/db/prisma';
import { canGenerateContent, canGenerateAudioOnDemand } from '@/lib/services/plan-limits.service';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { z } from 'zod';

const audioSchema = z.object({
  contentId: z.string(),
  queryId: z.string(),
  voiceId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { contentId, queryId, voiceId } = audioSchema.parse(body);

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

    // ✅ CHECK PLAN LIMITS
    const canGenerate = await canGenerateContent(
      session.user.id,
      queryId,
      'audio'
    );

    if (!canGenerate.allowed) {
      return NextResponse.json(
        { 
          error: canGenerate.reason,
          current: canGenerate.current,
          limit: canGenerate.limit,
        },
        { status: 403 }
      );
    }

    // ✅ CHECK ON-DEMAND ACCESS (Pro feature)
    const hasOnDemandAccess = await canGenerateAudioOnDemand(session.user.id);
    
    // Free users can only generate audio once per topic
    // Pro users can generate on-demand multiple times
    if (!hasOnDemandAccess && canGenerate.current! > 0) {
      return NextResponse.json(
        { 
          error: 'Audio already generated for this topic. Upgrade to Pro for on-demand audio generation.',
        },
        { status: 403 }
      );
    }

    // Extract text from content
    const text = typeof content.data === 'object' && content.data !== null
      ? (content.data as any).text || ''
      : String(content.data);

    if (!text) {
      return NextResponse.json({ error: 'No text content to convert' }, { status: 400 });
    }

    // ✅ Limit text length for free users (save on API costs)
    const maxLength = hasOnDemandAccess ? 10000 : 5000; // Pro: 10k chars, Free: 5k chars
    const truncatedText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;

    // Generate audio
    console.log(`🎵 Generating audio for user ${session.user.id} (${hasOnDemandAccess ? 'PRO' : 'FREE'})`);
    
    const audioBuffer = await generateSpeech({
      text: truncatedText,
      voiceId: '21m00Tcm4TlvDq8ikWAM',
    });

    // Save audio file
    const audioDir = join(process.cwd(), 'public', 'audio');
    if (!existsSync(audioDir)) {
      await mkdir(audioDir, { recursive: true });
    }

    const timestamp = Date.now();
    const filename = `${queryId}-${timestamp}.mp3`;
    const audioPath = join(audioDir, filename);
    await writeFile(audioPath, audioBuffer);

    // Create audio content record
    const audioContent = await prisma.content.create({
      data: {
        queryId: queryId,
        contentType: 'audio',
        title: `${content.title} - Audio`,
        storageUrl: `/audio/${filename}`,
        data: { 
          duration: 0, 
          originalContentId: contentId,
          truncated: text.length > maxLength,
        },
      },
    });

    console.log(`✅ Audio generated successfully: ${filename}`);

    return NextResponse.json({
      success: true,
      audioUrl: `/audio/${filename}`,
      audioContent,
      truncated: text.length > maxLength,
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
