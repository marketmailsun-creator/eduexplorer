import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { processResearchQuery } from '@/lib/services/research.service';
import { generateContentForQuery } from '@/lib/services/content.service';
import { analyzeImageWithClaude, transcribeAudio } from '@/lib/services/media-analysis.service';
import { z } from 'zod';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const querySchema = z.object({
  query: z.string().min(3).max(500),
  learningLevel: z.enum(['elementary', 'high-school', 'college', 'adult']).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const query = formData.get('query') as string;
    const learningLevel = (formData.get('learningLevel') as string) || 'college';

    // Validate basic input
    const { query: validatedQuery, learningLevel: validatedLevel } = querySchema.parse({
      query,
      learningLevel,
    });

    // Process attached files (images and documents)
    const files = formData.getAll('files') as File[];
    const imageAnalyses: string[] = [];
    const attachedFileUrls: string[] = [];

    for (const file of files) {
      if (file.size > 0) {
        // Save file
        const uploadsDir = join(process.cwd(), 'public', 'uploads');
        if (!existsSync(uploadsDir)) {
          await mkdir(uploadsDir, { recursive: true });
        }

        const timestamp = Date.now();
        const filename = `${timestamp}-${file.name}`;
        const filepath = join(uploadsDir, filename);
        const bytes = await file.arrayBuffer();
        await writeFile(filepath, Buffer.from(bytes));

        attachedFileUrls.push(`/uploads/${filename}`);

        // Analyze images with Claude
        if (file.type.startsWith('image/')) {
          const analysis = await analyzeImageWithClaude(Buffer.from(bytes), file.type);
          imageAnalyses.push(analysis);
        }
      }
    }

    // Process audio recording
    const audioFile = formData.get('audio') as File | null;
    let audioTranscription = '';

    if (audioFile && audioFile.size > 0) {
      const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
      
      // Save audio file
      const audioDir = join(process.cwd(), 'public', 'uploads', 'audio');
      if (!existsSync(audioDir)) {
        await mkdir(audioDir, { recursive: true });
      }

      const timestamp = Date.now();
      const audioFilename = `${timestamp}-recording.webm`;
      const audioPath = join(audioDir, audioFilename);
      await writeFile(audioPath, audioBuffer);

      // Transcribe audio (you can implement this with Whisper API or similar)
      audioTranscription = await transcribeAudio(audioBuffer);
    }

    // Enhance query with media context
    let enhancedQuery = validatedQuery;
    
    if (imageAnalyses.length > 0) {
      enhancedQuery += '\n\nAttached images show: ' + imageAnalyses.join('; ');
    }
    
    if (audioTranscription) {
      enhancedQuery += '\n\nAdditional context from audio: ' + audioTranscription;
    }

    // Process the research query
    const result = await processResearchQuery(
      session.user.id,
      enhancedQuery,
      validatedLevel as string
    );

    // Store attachment references
    if (attachedFileUrls.length > 0 || audioTranscription) {
      await prisma.query.update({
        where: { id: result.queryId },
        data: {
          metadata: {
            attachments: attachedFileUrls,
            hasAudio: !!audioTranscription,
            imageAnalyses,
          },
        },
      });
    }

    // Generate content asynchronously
    generateContentForQuery(result.queryId).catch(console.error);

    return NextResponse.json({
      success: true,
      queryId: result.queryId,
      content: result.content,
      sources: result.sources,
      mediaProcessed: {
        images: imageAnalyses.length,
        audio: !!audioTranscription,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Query submission error:', error);
    return NextResponse.json(
      { error: 'Failed to process query' },
      { status: 500 }
    );
  }
}
