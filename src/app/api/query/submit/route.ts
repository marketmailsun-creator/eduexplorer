import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { processResearchQuery } from '@/lib/services/research.service';
import { generateContentForQuery } from '@/lib/services/content.service';
import { generateAndSaveQuizForQuery } from '@/lib/services/practice-questions-generator';
import { moderateContent, getModerationErrorMessage, quickModerationCheck } from '@/lib/services/content-moderation.service';
import { analyzeImageWithClaude, extractTextFromPDF, analyzeMultipleImages } from '@/lib/services/media-analysis.service';
import { prisma } from '@/lib/db/prisma';
import { awardXP } from '@/lib/services/xp.service';
import { updateStreak } from '@/lib/services/streak.service';
import { checkAndUnlockAchievements } from '@/lib/services/achievement.service';
import { checkDailyLessonAllowed, incrementDailyLessons } from '@/lib/services/plan-limits.service';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Read user from DB (not JWT) — JWT plan can be stale after subscription
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { age: true, dateOfBirth: true, plan: true },
    });
    const userPlan = (user?.plan as 'free' | 'pro') || 'free';

    // Check daily lesson limit for free users
    const lessonCheck = await checkDailyLessonAllowed(session.user.id, userPlan);
    if (!lessonCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Daily lesson limit reached. Upgrade to Pro for unlimited lessons.',
          remaining: 0,
          limit: lessonCheck.limit,
        },
        { status: 429 }
      );
    }

    // ✅ Parse as FormData to support files + audio
    let query: string;
    let learningLevel: string = 'college';
    let files: File[] = [];
    let audioFile: File | null = null;

    const contentType = req.headers.get('content-type') || '';
    let autoQuizFlag = false;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      query = (formData.get('query') as string) || '';
      learningLevel = (formData.get('learningLevel') as string) || 'college';
      autoQuizFlag = formData.get('autoQuiz') === 'true';
      files = formData.getAll('files') as File[];
      audioFile = (formData.get('audio') as File) || null;
    } else {
      // Fallback: still support plain JSON (for any other callers)
      const body = await req.json();
      query = body.query || '';
      learningLevel = body.learningLevel || 'college';
      autoQuizFlag = body.autoQuiz === true;
    }

    // Validate
    // Validate — allow empty query if files or audio are attached (media will generate context)
    const hasMediaInput = files.length > 0 || (audioFile && audioFile.size > 0);

    if (!query || query.trim().length < 3) {
      if (!hasMediaInput) {
        return NextResponse.json({ error: 'Please enter a question, or attach an image/file.' }, { status: 400 });
      }
      // Media-only submission — query will be derived from media analysis below
      query = '';
    }

    if (query.length > 2000) {
      return NextResponse.json({ error: 'Query is too long' }, { status: 400 });
    }


    const validLevels = ['elementary', 'high-school', 'college', 'adult'];
    if (!validLevels.includes(learningLevel)) {
      learningLevel = 'college';
    }

    console.log('📝 Query submitted:', query);
    console.log('📎 Files attached:', files.length);
    console.log('🎤 Audio attached:', audioFile ? 'Yes' : 'No');

    // ✅ Process media inputs and enrich the query
    let enrichedQuery = query.trim();
    const mediaContextParts: string[] = [];

    // Process images from camera/attachments
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    const docFiles = files.filter(f => !f.type.startsWith('image/'));
    try {
        if (imageFiles.length === 1) {
          console.log('🖼️ Analyzing single image:', imageFiles[0].name);
          const buffer = Buffer.from(await imageFiles[0].arrayBuffer());
          const analysis = await analyzeImageWithClaude(buffer, imageFiles[0].type);
          mediaContextParts.push(`[Image content: ${analysis}]`);
          console.log('✅ Image analyzed');
        } else if (imageFiles.length > 1) {
          console.log('🖼️ Analyzing multiple images:', imageFiles.length);
          const imageData = await Promise.all(
            imageFiles.map(async (f) => ({
              buffer: Buffer.from(await f.arrayBuffer()),
              mimeType: f.type,
            }))
          );
          const analysis = await analyzeMultipleImages(imageData);
          mediaContextParts.push(`[Images content: ${analysis}]`);
          console.log('✅ Multiple images analyzed');
        }
      } catch (error) {
        console.error('❌ Image analysis failed:', error);
        return NextResponse.json(
          { error: 'Failed to analyze the attached image. Please try again or type your question manually.' },
          { status: 422 }
        );
      }

      // Process document attachments (PDF, DOCX, TXT)
        try{
          for (const docFile of docFiles) {
          console.log('📄 Processing document:', docFile.name, docFile.type);
          const buffer = Buffer.from(await docFile.arrayBuffer());

          if (docFile.type === 'application/pdf') {
            const text = await extractTextFromPDF(buffer);
            mediaContextParts.push(`[Document "${docFile.name}" content: ${text}]`);
            console.log('✅ PDF extracted');
          } else if (
            docFile.type === 'text/plain' ||
            docFile.type === 'application/msword' ||
            docFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ) {
            // For text/docx files, read as text directly
            const text = buffer.toString('utf-8').substring(0, 5000);
            mediaContextParts.push(`[Document "${docFile.name}" content: ${text}]`);
            console.log('✅ Document text extracted');
          }
        }
      } catch (error) {
        console.error('❌ Document processing failed:', error);
        return NextResponse.json(
          { error: 'Failed to process one of the attached documents. Please try again or type your question manually.' },
          { status: 422 }
        );

      }
      

    // Process audio — use client-supplied transcript if provided, else note it
   // Process audio — transcript is already in query field via client-side SpeechRecognition
    if (audioFile && audioFile.size > 0) {
      console.log('🎤 Audio recording received:', audioFile.size, 'bytes');
      // The query field already contains the transcript from client-side SpeechRecognition.
      // Audio blob is kept for reference/future Whisper upgrade.
      mediaContextParts.push(`[Note: User submitted a voice recording. The query text above is the transcription.]`);
      console.log('✅ Audio context noted');
    }

    // Append all media context to the query
    // Build final enriched query
    if (mediaContextParts.length > 0) {
      if (query.trim()) {
        // User provided text + media
        enrichedQuery = `${query}\n\n${mediaContextParts.join('\n\n')}`;
      } else {
        // Media-only — construct query entirely from media analysis
        enrichedQuery = `Please analyze and explain the following:\n\n${mediaContextParts.join('\n\n')}`;
      }
      console.log('✅ Query enriched with media context');
    } else if (!enrichedQuery.trim()) {
      // Shouldn't reach here due to validation above, but safety fallback
      return NextResponse.json({ error: 'No input provided.' }, { status: 400 });
    }

    // user was already fetched at the top of the handler (includes age, dateOfBirth, plan)
    const userAge: number | undefined = user?.age ?? undefined;
    console.log('👤 User age:', userAge ?? 'unknown');

    // Step 1: Quick keyword check (fast)
    const quickCheckFailed = quickModerationCheck(query); // moderate the original query, not media context

    if (quickCheckFailed) {
      console.log('🚫 Quick moderation failed - running full check');
    }

    // Step 2: Full AI moderation
    const shouldRunFullModeration = (userAge && userAge < 18) || quickCheckFailed;

    if (shouldRunFullModeration) {
      console.log('🛡️ Running content moderation...');

      const moderationResult = await moderateContent(query, userAge);

      if (!moderationResult.isAppropriate) {
        console.log('🚫 Content blocked by moderation');

        const errorMessage = getModerationErrorMessage(moderationResult, userAge);

        return NextResponse.json(
          {
            error: errorMessage,
            moderationResult: {
              category: moderationResult.category,
              severity: moderationResult.severity,
            },
          },
          { status: 400 }
        );
      }

      console.log('✅ Content passed moderation');
    } else {
      console.log('⏩ Skipping full moderation (adult user, no flags)');
    }

    // ✅ Process with enriched query (includes media context)
    const result = await processResearchQuery({
      userId: session.user.id,
      queryText: enrichedQuery,
      learningLevel,
    });

    if (autoQuizFlag) {
      // Pre-generate quiz server-side so results page loads with quiz already available.
      // Eliminates client-side router.refresh() call in InteractiveResultsView.
      await generateAndSaveQuizForQuery(result.queryId, enrichedQuery, learningLevel);
    } else {
      await generateContentForQuery(result.queryId);
    }

    // Gamification: increment daily counter, award XP, update streak, check achievements
    // Run fire-and-forget so errors don't block the response
    incrementDailyLessons(session.user.id).catch(() => {});
    awardXP(session.user.id, 5, 'subject_search', { queryId: result.queryId }).catch(() => {});
    updateStreak(session.user.id).catch(() => {});
    checkAndUnlockAchievements(session.user.id).catch(() => {});

    return NextResponse.json({
      success: true,
      queryId: result.queryId,
      content: result.content,
      sources: result.sources,
    });
  } catch (error) {
    console.error('Query submission error:', error);
    const message = error instanceof Error ? error.message : 'Failed to process query';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}