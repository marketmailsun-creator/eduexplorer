import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Swords } from 'lucide-react';
import Link from 'next/link';
import { formatForDisplay } from '@/lib/utils/text-formatter';
import { InteractiveResultsView } from '@/components/features/InteractiveResultsView';
import { CommentSection } from '@/components/social/CommentSection';
import { SaveButton } from '@/components/features/SaveButton';
import ShareButton from '@/components/social/ShareButton';
import { nanoid } from 'nanoid';
import { WhatToLearnNext } from '@/components/features/WhatToLearnNext';
import { WhatsAppShareButton } from '@/components/features/WhatsAppShareButton';
import { getQueryAccess } from '@/lib/utils/query-access';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function ResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ challenge?: string; mode?: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const { id } = await params;
  const { challenge: challengeParam, mode } = await searchParams;
  const autoQuizMode = mode === 'quiz';

  console.log('📊 Loading results for query:', id);

  // Determine access level before fetching content
  const accessResult = await getQueryAccess(session.user.id, id);
  if (accessResult.type === 'denied') {
    redirect('/explore');
  }

  const isOwner = accessResult.type === 'owner';

  // For challenge mode: prefer the validated DB result, fall back to URL param
  const challengeId: string | undefined =
    accessResult.type === 'challenge' ? accessResult.challengeId
    : challengeParam ?? undefined;

  // ✅ OPTIMIZED: Single database query for all content
  const query = await prisma.query.findUnique({
    where: { id },
    include: {
      researchData: true,
      content: {
        orderBy: { generatedAt: 'asc' },
      },
      savedByUsers: {
        where: { userId: session.user.id },
        take: 1,
      },
    },
  });

  if (!query) redirect('/explore');

  // sharedContent for comments:
  // Owner → use/create their own sharedContent record
  // Non-owner → use the OWNER's sharedContent (same comment thread for group/challenge)
  let sharedContent = await prisma.sharedContent.findFirst({
    where: {
      queryId: id,
      userId: isOwner ? session.user.id : query.userId,
    },
  });

  if (isOwner && !sharedContent) {
    console.log('✨ Creating SharedContent for comments...');
    sharedContent = await prisma.sharedContent.create({
      data: {
        queryId: id,
        userId: session.user.id,
        shareType: 'public',
        shareToken: nanoid(10),
      },
    });
  }

  const isSaved = query.savedByUsers.length > 0;

  // Extract all content types
  const articleContent = query.content.find((c: any) => c.contentType === 'article');
  const audioContent = query.content.find((c: any) => c.contentType === 'audio');
  const presentationContent = query.content.find((c: any) => c.contentType === 'presentation');
  const flashcardContent = query.content.find((c: any) => c.contentType === 'flashcards');
  const diagramContent = query.content.find((c: any) => c.contentType === 'diagrams');
  const quizContent = query.content.find((c: any) => c.contentType === 'quiz');
  const conceptMapContent = query.content.find((c: any) => c.contentType === 'concept-map');

  const conceptMapData = conceptMapContent?.data || null;
  const article = articleContent?.data as any;
  const articleText = (article?.text as string) || (query.researchData as any)?.rawData?.content || '';

  const hasAudioContent = !!audioContent?.storageUrl;
  const presentationData = presentationContent?.data as any;
  const hasPresentationData = presentationData?.status === 'completed' && presentationData?.presentation;

  const flashcardData = flashcardContent?.data as any;
  const hasFlashcards = flashcardData?.status === 'completed' && flashcardData?.deck;

  const diagramData = diagramContent?.data as any;
  const hasDiagrams = diagramData?.status === 'completed' && diagramData?.diagrams;

  const quizData = quizContent?.data as any;
  const hasQuiz = quizData?.status === 'completed' && quizData?.quiz;

  console.log('✅ Content status (loaded from DB):');
  console.log('  - Article:', !!articleContent);
  console.log('  - Audio:', hasAudioContent ? 'exists' : 'not found');
  console.log('  - Presentation:', hasPresentationData ? 'cached' : 'not generated');
  console.log('  - Flashcards:', hasFlashcards ? 'cached' : 'not generated');
  console.log('  - Diagrams:', hasDiagrams ? 'cached' : 'not generated');
  console.log('  - Quiz:', hasQuiz ? 'cached' : 'not generated');

  const quiz = hasQuiz ? quizData.quiz : null;

  // Get clean text for display
  const rawText = article?.text || (query.researchData as any)?.rawData?.content || '';
  const cleanText = formatForDisplay(rawText);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section — gradient design */}
      <div className="bg-gradient-to-r from-violet-700 via-purple-700 to-indigo-700 px-4 py-4 sticky top-0 z-10 shadow-lg">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <Link href="/explore">
            <Button variant="ghost" size="sm" className="gap-2 mb-2 -ml-2 text-white/80 hover:text-white hover:bg-white/15">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back</span>
            </Button>
          </Link>

          {/* Title */}
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white leading-tight">
              {query.queryText}
            </h1>
            <p className="text-xs sm:text-sm text-purple-200 mt-1">
              Level: {query.complexityLevel || 'college'}
            </p>
          </div>

          {/* Access context banners */}
          {accessResult.type === 'group' && (
            <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-white/15 backdrop-blur-sm rounded-lg text-sm text-white">
              <Users className="h-4 w-4 flex-shrink-0" />
              <span>
                Shared by{' '}
                <strong>{accessResult.sharedByUser?.name ?? 'a group member'}</strong>{' '}
                in <strong>{accessResult.groupName}</strong>
              </span>
            </div>
          )}
          {accessResult.type === 'challenge' && (
            <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-white/15 backdrop-blur-sm rounded-lg text-sm text-white">
              <Swords className="h-4 w-4 flex-shrink-0" />
              <span>
                ⚔️ Challenge:{' '}
                <strong>{accessResult.challengerName}</strong> vs{' '}
                <strong>{accessResult.challengeeName}</strong> — take the quiz to compete!
              </span>
            </div>
          )}

          {/* Action buttons — Share/WhatsApp only for owner; Save for everyone */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {isOwner && (
              <>
                <ShareButton queryId={query.id} title={query.queryText} />
                <WhatsAppShareButton
                  topic={query.queryText}
                  summary={cleanText}
                  queryId={query.id}
                />
              </>
            )}
            <SaveButton queryId={query.id} isSaved={isSaved} />
          </div>
        </div>
      </div>

      {/* Content Layout */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <InteractiveResultsView
            query={query}
            cleanText={cleanText}
            hasAudioContent={hasAudioContent}
            audioContent={audioContent}
            hasPresentationData={hasPresentationData}
            presentationData={presentationData}
            hasFlashcards={hasFlashcards}
            flashcardData={flashcardData}
            hasDiagrams={hasDiagrams}
            diagramData={diagramData}
            hasQuiz={hasQuiz}
            quiz={quiz}
            conceptMapData={conceptMapData}
            articleText={articleText}
            queryId={id}
            isOwner={isOwner}
            challengeId={challengeId}
            autoQuizMode={autoQuizMode}
          />
        </div>
        <div className="px-4 sm:px-6 pb-10 max-w-7xl mx-auto">
          <WhatToLearnNext queryId={id} currentTopic={query.queryText} hasQuiz={hasQuiz} />
        </div>
        {sharedContent && (
          <div className="mt-8">
            <CommentSection sharedContentId={sharedContent.id} />
          </div>
        )}
      </div>
    </div>
  );
}
